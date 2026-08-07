"""
parser.py  –  Extract transactions from bank statement PDFs.

Strategy (tried in order for each PDF):
  1. pdfplumber table extraction  →  works for most structured statements
  2. pdfplumber raw text + regex  →  fallback for text-layout statements
  3. pypdf raw text + regex       →  last resort

Supports: SBI, HDFC, ICICI, Axis, Kotak, PNB, Bank of Baroda,
          Canara, Union Bank, Yes Bank, IndusInd, and most others
          that produce machine-readable (non-scanned) PDFs.
"""

from __future__ import annotations
import re
import io
from datetime import datetime
from dataclasses import dataclass, field
from typing import Optional

import pdfplumber
import pypdf


# ── Data model ───────────────────────────────────────────────────────────────

@dataclass
class Transaction:
    date: datetime
    description: str
    debit: float      = 0.0
    credit: float     = 0.0
    balance: float    = 0.0
    raw_date_str: str = ""
    account: str      = ""   # masked account display, e.g. "...0909"; set by caller


# ── Date patterns ─────────────────────────────────────────────────────────────

DATE_PATTERNS = [
    # DD/MM/YYYY  DD-MM-YYYY  DD.MM.YYYY
    (re.compile(r"\b(\d{2})[/\-\.](\d{2})[/\-\.](\d{4})\b"), "%d%m%Y"),
    # DD/MM/YY
    (re.compile(r"\b(\d{2})[/\-\.](\d{2})[/\-\.](\d{2})\b"), "%d%m%y"),
    # DD MMM YYYY  (01 Jan 2024)
    (re.compile(r"\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})\b",
                re.IGNORECASE), "dmmmY"),
    # YYYY-MM-DD
    (re.compile(r"\b(\d{4})[/\-\.](\d{2})[/\-\.](\d{2})\b"), "%Y%m%d"),
]

MONTH_MAP = {m: str(i+1).zfill(2)
             for i, m in enumerate(
                 ["jan","feb","mar","apr","may","jun",
                  "jul","aug","sep","oct","nov","dec"])}


def _parse_date(s: str) -> Optional[datetime]:
    """Try every known date pattern against string s."""
    s = s.strip()
    for pattern, fmt in DATE_PATTERNS:
        m = pattern.search(s)
        if not m:
            continue
        try:
            if fmt == "dmmmY":
                day, mon, yr = m.group(1), m.group(2).lower()[:3], m.group(3)
                mon_num = MONTH_MAP.get(mon, "01")
                return datetime.strptime(f"{day}{mon_num}{yr}", "%d%m%Y")
            groups = list(m.groups())
            joined = "".join(groups)
            return datetime.strptime(joined, fmt)
        except ValueError:
            continue
    return None


# ── Amount parsing ─────────────────────────────────────────────────────────────

def _parse_amount(s: str) -> Optional[float]:
    """Convert amount strings like '1,23,456.78' or '1234.56 Cr' to float."""
    if s is None:
        return None
    s = str(s).strip()
    # Remove currency symbols, commas
    s = re.sub(r"[₹$,\s]", "", s)
    # Remove trailing Dr/Cr markers (handled by caller)
    s = re.sub(r"(?i)(dr|cr)$", "", s).strip()
    if not s or s in ("-", "–", ""):
        return None
    try:
        return abs(float(s))
    except ValueError:
        return None


# ── Column header detection ───────────────────────────────────────────────────

HEADER_SYNONYMS = {
    "date":        ["date", "txn date", "trans date", "value date", "posting date",
                    "transaction date"],
    "description": ["description", "narration", "particulars", "remarks",
                    "transaction details", "details", "chq/ref", "reference",
                    "transaction remarks"],
    "debit":       ["debit", "dr", "withdrawal", "withdrawals", "debit amount",
                    "amount debited", "dr amount"],
    "credit":      ["credit", "cr", "deposit", "deposits", "credit amount",
                    "amount credited", "cr amount"],
    "balance":     ["balance", "closing balance", "running balance",
                    "avl balance", "available balance"],
    "amount":      ["amount", "transaction amount"],
}


def _match_col(header: str, key: str) -> bool:
    h = header.strip().lower()
    for syn in HEADER_SYNONYMS.get(key, []):
        if h == syn:
            return True
        # Word-boundary via negative lookbehind/ahead on [a-z] so that
        # short synonyms like "cr" don't match inside "Init.Br" or "Chq No"
        # (neither contains the substring "cr", but the check also guards
        # against headers like "credit" matching the "cr" synonym).
        if re.search(r"(?<![a-z])" + re.escape(syn) + r"(?![a-z])", h):
            return True
    return False


def _find_col(headers: list[str], key: str) -> Optional[int]:
    for i, h in enumerate(headers):
        if h and _match_col(h, key):
            return i
    return None


# ── Table-based extraction ────────────────────────────────────────────────────

def _extract_from_table(table: list[list],
                         fallback_col_map: Optional[dict] = None
                         ) -> tuple[list[Transaction], Optional[dict]]:
    """Parse a pdfplumber table into transactions.

    Returns (transactions, col_map_if_header_found).
    col_map is None when the header was not found (fallback used instead).
    """
    if not table or len(table) < 1:
        return [], None

    # Find header row (first row with date/description keywords)
    header_row_idx = None
    headers = []
    for i, row in enumerate(table[:5]):
        row_text = " ".join(str(c or "").lower() for c in row)
        if any(syn in row_text for syn in ["date", "narration", "debit", "credit", "withdrawal"]):
            header_row_idx = i
            # replace embedded newlines pdfplumber sometimes inserts in cells
            headers = [str(c or "").strip().replace("\n", " ") for c in row]
            break

    if header_row_idx is None:
        # No header found — try fallback column map from a previous page
        if fallback_col_map is None:
            return [], None
        date_col  = fallback_col_map.get("date")
        desc_col  = fallback_col_map.get("desc")
        debit_col = fallback_col_map.get("debit")
        cred_col  = fallback_col_map.get("credit")
        bal_col   = fallback_col_map.get("balance")
        amt_col   = fallback_col_map.get("amount")
        data_start = 0        # every row is data (no header row to skip)
        detected_map = None   # don't update the saved map
    else:
        date_col  = _find_col(headers, "date")
        desc_col  = _find_col(headers, "description")
        debit_col = _find_col(headers, "debit")
        cred_col  = _find_col(headers, "credit")
        bal_col   = _find_col(headers, "balance")
        amt_col   = _find_col(headers, "amount")   # some banks have single amount col

        if date_col is None:
            return [], None

        detected_map = {
            "date": date_col, "desc": desc_col,
            "debit": debit_col, "credit": cred_col,
            "balance": bal_col, "amount": amt_col,
        }
        data_start = header_row_idx + 1

    txns = []
    for row in table[data_start:]:
        if not row or all(c is None or str(c).strip() == "" for c in row):
            continue

        date_val = str(row[date_col]).strip() if date_col < len(row) else ""
        dt = _parse_date(date_val)
        if dt is None:
            continue

        desc = ""
        if desc_col is not None and desc_col < len(row):
            desc = str(row[desc_col] or "").strip()

        # Determine debit / credit
        debit = credit = 0.0

        if debit_col is not None and debit_col < len(row):
            v = _parse_amount(row[debit_col])
            if v is not None:
                debit = v
        if cred_col is not None and cred_col < len(row):
            v = _parse_amount(row[cred_col])
            if v is not None:
                credit = v

        # Single amount column + Dr/Cr marker
        if amt_col is not None and debit == 0.0 and credit == 0.0:
            raw_amt = str(row[amt_col] or "").strip()
            v = _parse_amount(raw_amt)
            if v:
                if re.search(r"(?i)dr$", raw_amt):
                    debit = v
                elif re.search(r"(?i)cr$", raw_amt):
                    credit = v
                else:
                    # Look for a Dr/Cr marker in a nearby column
                    row_text = " ".join(str(c or "") for c in row)
                    if re.search(r"(?i)\bdr\b", row_text):
                        debit = v
                    else:
                        credit = v

        balance = 0.0
        if bal_col is not None and bal_col < len(row):
            v = _parse_amount(row[bal_col])
            if v is not None:
                balance = v

        txns.append(Transaction(
            date=dt, description=desc,
            debit=debit, credit=credit,
            balance=balance, raw_date_str=date_val
        ))

    return txns, detected_map


# ── Regex-based text extraction ───────────────────────────────────────────────

# Matches a line that starts with a date + has at least one monetary amount
_LINE_RE = re.compile(
    r"(?P<date>"
    r"\d{2}[/\-\.]\d{2}[/\-\.]\d{2,4}"           # DD/MM/YYYY or DD/MM/YY
    r"|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{4}"
    r"|\d{4}[/\-\.]\d{2}[/\-\.]\d{2}"             # YYYY-MM-DD
    r")"
    r"\s+(?P<rest>.+)$",
    re.IGNORECASE
)

_AMOUNT_RE = re.compile(r"[\d,]+\.\d{2}")


def _extract_from_text(text: str) -> list[Transaction]:
    """Regex fallback: parse raw text lines."""
    txns = []
    lines = text.splitlines()

    for line in lines:
        line = line.strip()
        m = _LINE_RE.match(line)
        if not m:
            continue

        dt = _parse_date(m.group("date"))
        if dt is None:
            continue

        rest = m.group("rest")
        amounts = _AMOUNT_RE.findall(rest)
        if not amounts:
            continue

        # Strip amounts from rest to get description
        desc = _AMOUNT_RE.sub("", rest).strip()
        desc = re.sub(r"\s{2,}", " ", desc).strip("| /-")

        # Heuristic: last 1-2 amounts are balance (and possibly debit/credit)
        floats = [float(a.replace(",", "")) for a in amounts]

        balance = floats[-1] if floats else 0.0
        debit = credit = 0.0

        if len(floats) >= 3:
            # date  desc  debit  credit  balance
            debit  = floats[-3]
            credit = floats[-2]
        elif len(floats) == 2:
            # Could be debit or credit + balance
            # Check for Dr/Cr marker
            if re.search(r"(?i)\bdr\b", rest):
                debit  = floats[-2]
            elif re.search(r"(?i)\bcr\b", rest):
                credit = floats[-2]
            else:
                # Ambiguous — skip debit/credit split, just record balance
                pass
        # len == 1: only balance visible

        txns.append(Transaction(
            date=dt, description=desc,
            debit=debit, credit=credit,
            balance=balance, raw_date_str=m.group("date")
        ))

    return txns


# ── Public entry point ────────────────────────────────────────────────────────

def extract_transactions(pdf_path: str,
                         password: Optional[str] = None
                         ) -> tuple[list[Transaction], str, str]:
    """
    Extract all transactions from a bank statement PDF using pdfplumber.

    Returns (transactions, account_display, holder_name) where:
      account_display  masked account number, e.g. "...0909" or "Unknown"
      holder_name      title-cased account holder, e.g. "Shiv Abhishek Pande" or ""

    Tries two table-detection strategies per page:
      1. Default line-based  (works for bordered tables)
      2. Text-position based (works for Axis Bank and other borderless layouts)
    """
    all_txns: list[Transaction] = []
    column_map: Optional[dict] = None   # reused for headerless continuation pages

    open_kw: dict = {}
    if password:
        open_kw["password"] = password

    with pdfplumber.open(pdf_path, **open_kw) as pdf:
        # ── Extract account number and holder name from page 1 ───────────────
        page1_text = pdf.pages[0].extract_text() or ""

        acct_match = re.search(
            r'(?:Statement of Account No|Account No)[.\s:]*([X\d]{6,20})',
            page1_text, re.IGNORECASE
        )
        account_number = acct_match.group(1).strip() if acct_match else "Unknown"
        if len(account_number) > 4 and account_number != "Unknown":
            account_display = "..." + account_number[-4:]
        else:
            account_display = account_number

        # First try: all-caps line of 3+ words (Axis Bank header style)
        name_match = re.search(
            r'^([A-Z][A-Z\s]{5,40})$',
            page1_text, re.MULTILINE
        )
        # Fallback: labeled format "Name: SHIV ABHISHEK PANDE"
        if not name_match:
            name_match = re.search(
                r'(?:Name|Account\s*Holder)[:\s]+([A-Z][A-Z\s]{5,40})',
                page1_text, re.IGNORECASE
            )
        holder_name = name_match.group(1).strip().title() if name_match else ""

        for page_num, page in enumerate(pdf.pages, start=1):
            page_txns: list[Transaction] = []

            # ── Strategy A: default line-based detection ──────────
            tables_a = page.extract_tables()
            for table in tables_a:
                rows, detected = _extract_from_table(table, fallback_col_map=column_map)
                if detected is not None:
                    column_map = detected
                page_txns.extend(rows)

            # ── Strategy B: text-position for borderless tables ───
            # Only attempted when Strategy A produced zero transactions.
            # Axis Bank PDFs have no ruled borders so A finds tables but
            # extracts nothing; B infers columns from character alignment.
            if not page_txns:
                tables_b = page.extract_tables(table_settings={
                    "vertical_strategy":   "text",
                    "horizontal_strategy": "text",
                })
                for table in tables_b:
                    rows, detected = _extract_from_table(table, fallback_col_map=column_map)
                    if detected is not None:
                        column_map = detected
                    page_txns.extend(rows)

            all_txns.extend(page_txns)

    # Per-PDF dedup (catches duplicate rows within a single statement)
    seen: set = set()
    unique: list[Transaction] = []
    for t in all_txns:
        key = (t.date,
               round(t.debit,   2),
               round(t.credit,  2),
               round(t.balance, 2))
        if key not in seen:
            seen.add(key)
            unique.append(t)

    unique.sort(key=lambda t: t.date)
    for t in unique:
        t.account = account_display
    return unique, account_display, holder_name
