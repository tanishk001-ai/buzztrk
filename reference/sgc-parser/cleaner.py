"""
cleaner.py  –  Clean raw bank narration text into human-readable names.

Works in two passes:
  1. Strip known bank prefixes / noise (UPI, NEFT, IMPS, ATM, etc.)
  2. Title-case and clean up whitespace / special chars

Axis Bank specific formats are handled by _AXIS_PATTERNS before general
prefix stripping — see _apply_axis_rules().
"""

from __future__ import annotations
import re

# ── Prefix patterns to strip ──────────────────────────────────────────────────
# Order matters — more specific first

_PREFIX_RULES = [
    # UPI variants
    r"^UPI[/\-][\d]+[/\-]?",           # UPI/9876543210/
    r"^UPI[/\-]",                        # UPI/
    r"^UPIREF[/\-][\w]+[/\-]?",

    # NEFT / RTGS
    r"^NEFT\s+(?:CR|DR)[/\-]?",
    r"^NEFT[/\-]?(?:CR|DR)?[/\-][\w]+[/\-]?",
    r"^NEFT[/\-]",
    r"^RTGS[/\-]?(?:CR|DR)?[/\-][\w]+[/\-]?",
    r"^RTGS[/\-]",

    # IMPS
    r"^IMPS[/\-][\d]+[/\-]?",
    r"^IMPS[/\-]",

    # ATM withdrawals
    r"^ATM\s+WDL[/\-][\w\s]+[/\-]?",
    r"^ATM\s+(?:CASH\s+)?WITHDRAWAL\s*[/\-]?",
    r"^ATM[/\-]",

    # Cheque
    r"^CHQ[/\-]?(?:NO)?[/\-]?[\d]+[/\-]?",
    r"^CHEQUE[/\-]?(?:NO)?[/\-]?[\d]+[/\-]?",
    r"^CHS[/\-][\d]+[/\-]?",

    # POS / Card
    r"^POS[/\-][\d*]+[/\-]?",
    r"^CARD[/\-][\d*]+[/\-]?",
    r"^DEBIT\s+CARD[/\-]?",

    # NACH / ECS / Auto-debit
    r"^NACH[/\-]",
    r"^ECS[/\-]",
    r"^ACH[/\-]",
    r"^SI[/\-]",

    # Mobile / Internet banking
    r"^MB[/\-]",
    r"^IB[/\-]",
    r"^INB[/\-]",
    r"^MOB[/\-]",

    # MMT / PHONEPE / GPAY / PAYTM
    r"^MMT[/\-]",
    r"^PHONEPE[/\-][\d]+[/\-]?",
    r"^PHONEPE[/\-]",
    r"^GPAY[/\-]",
    r"^GOOGLEPAY[/\-]",
    r"^PAYTM[/\-][\d]+[/\-]?",
    r"^PAYTM[/\-]",
    r"^AMAZON\s*PAY[/\-]",

    # Bank charges / interest labels
    r"^BY\s+TRANSFER[/\-]?",
    r"^TO\s+TRANSFER[/\-]?",
    r"^TRANSFER[/\-]",
    r"^TRF[/\-]",

    # Transaction reference numbers (standalone)
    r"^[\d]{6,}[/\-]",
    r"^[A-Z]{4}[\d]{6,}[/\-]?",
]

_PREFIX_RE = re.compile(
    "|".join(f"(?:{p})" for p in _PREFIX_RULES),
    re.IGNORECASE
)

# ── Noise words / suffixes to remove ─────────────────────────────────────────

_NOISE_SUFFIXES = re.compile(
    r"\s*[/\-]\s*(?:[\d]{6,}|[A-Z]{2,4}[\d]{4,})$",
    re.IGNORECASE
)

_ACCOUNT_NUMBER = re.compile(r"\b[\dX*]{8,}\b")
_EXTRA_SPACES   = re.compile(r"\s{2,}")
_SLASH_SPACE    = re.compile(r"\s*/\s*")


# ── Title-case helper ─────────────────────────────────────────────────────────

def _title(s: str) -> str:
    """Title-case but preserve known acronyms."""
    _ACRONYMS = {"upi", "neft", "rtgs", "imps", "atm", "emi",
                 "gst", "tds", "pf", "esic", "nach", "ecs",
                 "sbi", "hdfc", "icici", "lic", "ltd",
                 "pvt", "llp", "opc", "cr", "dr"}
    words = s.strip().split()
    result = []
    for w in words:
        if w.lower() in _ACRONYMS:
            result.append(w.upper())
        else:
            result.append(w.capitalize())
    return " ".join(result)


# ── Axis Bank helpers ─────────────────────────────────────────────────────────

_TRUNCATED_SUFFIXES = {"limi", "limit", "limite"}

_BRAND_MAP = {
    "indusind": "IndusInd",
    "paytm":    "Paytm",
    "mobikwik": "Mobikwik",
    "netflix":  "Netflix",
    "amazon":   "Amazon",
    "phonepe":  "PhonePe",
    "gpay":     "GPay",
}


def _clean_entity(name: str) -> str:
    """Title-case an entity name, strip PDF-truncated suffixes, fix known brands."""
    parts = name.strip().split()
    parts = [p for p in parts if p.lower() not in _TRUNCATED_SUFFIXES]
    result = []
    for p in parts:
        low = p.lower()
        if low in _BRAND_MAP:
            result.append(_BRAND_MAP[low])
        elif low in {"hdfc", "icici", "sbi", "axis", "atm", "emi",
                     "upi", "imps", "neft", "rtgs"}:
            result.append(p.upper())
        else:
            result.append(p.capitalize())
    return " ".join(result)


def _clean_merchant(name: str) -> str:
    """Clean an e-commerce or POS merchant name."""
    name = name.strip()
    ptm = re.match(r"^PTM\*(\w+)", name, re.IGNORECASE)
    if ptm:
        brand = ptm.group(1)
        return _BRAND_MAP.get(brand.lower(), _title(brand))
    name = re.sub(r"\s+In\b", "", name, flags=re.IGNORECASE).strip()
    return _clean_entity(name)


# ── IMPS P2A bank-code / digit-only filter ────────────────────────────────────

_IMPS_BANK_CODES = frozenset({
    "bankof", "stateb", "hdfcb", "icicib", "pnbank", "axisb",
    "unionb", "canara", "yesbnk", "indusb", "kotakb", "federl",
})


def _imps_p2a_handler(m, s: str) -> str:
    name = m.group(1).strip()
    if re.match(r"^\d+$", name) or name.lower() in _IMPS_BANK_CODES:
        return "IMPS Transfer"
    return f"IMPS to {_title(name)}"


# ── P2A / P2M helpers ─────────────────────────────────────────────────────────

_P2_MERCHANT_MAP = {
    "amazon pa":  "Amazon Pay",
    "amazonpa":   "Amazon Pay",
    "satvic mo":  "Satvic Movement",
    "vastram t":  "Vastram",
}


def _clean_p2_name(name: str) -> str:
    low = name.lower().strip()
    if low in _P2_MERCHANT_MAP:
        return _P2_MERCHANT_MAP[low]
    return _clean_entity(name)


# Matches "P2a - - Raja - India Pos - Na" / "P2m - - Amazon Pa - Axis Bank - You Are"
# (pdfplumber cell-join form of UPI P2A/P2M narrations)
_P2_CELL_RE = re.compile(
    r"^P2[AM]\s*[-\s][-\s]*([A-Za-z][^-\n]+?)\s*-\s*\w",
    re.IGNORECASE
)


# ── Brand normalization (applied to final result) ─────────────────────────────

_BRAND_FIX = {
    "paytmrecharge":   "Paytm Recharge",
    "paytm_addmone":   "Paytm Add Money",
    "paytm addmone":   "Paytm Add Money",
    "googleplay":      "Google Play",
    "google play":     "Google Play",
    "youtube cybs si": "YouTube",
    "youtube":         "YouTube",
    "netflix":         "Netflix",
    "one97":           "Paytm",
    "one97 communi":   "Paytm",
    "amazon pa":       "Amazon Pay",
    "satvic mo":       "Satvic Movement",
    "vastram t":       "Vastram",
    "europride":       "Europride",
}


# ── Axis Bank specific pattern table ─────────────────────────────────────────
# Applied before generic prefix stripping in clean_narration().
# Each entry: (compiled_regex, handler(match, original_string) -> str)

_AXIS_PATTERNS = [
    # AXMOB — Axis mobile banking
    (re.compile(r"^AXMOB[/\-]", re.IGNORECASE),
     lambda m, s: "Mobile Banking - AXMOB"),

    # MOB/SELFFT/<name>/<account> — Self fund transfer
    (re.compile(r"^MOB[/\-]SELFFT[/\-]([A-Za-z][^/]*)[/\-]", re.IGNORECASE),
     lambda m, s: f"Self Transfer - {_title(m.group(1).strip())}"),

    # MOB/TPFT/<name> or TPFT/<name> — Third Party Fund Transfer (own-account)
    (re.compile(r"^(?:MOB[/\-])?TPFT[/\-]([A-Za-z][^/\n]*?)(?:[/\-]|$)", re.IGNORECASE),
     lambda m, s: f"Self Transfer - {_title(m.group(1).strip())}"),

    # PPR<ref>_EMI_<date> — Loan EMI payment
    (re.compile(r"^PPR[\w]*_EMI_", re.IGNORECASE),
     lambda m, s: "EMI Payment"),

    # <account_no>:Int.Pd:<date_range> — Interest credited/paid
    (re.compile(r"^[\d]+:Int\.Pd:", re.IGNORECASE),
     lambda m, s: "Interest Paid"),

    # UPI/P2A/<ref>/<name>/<bank> — UPI person-to-account
    (re.compile(r"^UPI[/\-]P2A[/\-][\d]*[/\-]([A-Za-z][^/\n]*?)[/\-]", re.IGNORECASE),
     lambda m, s: _clean_p2_name(m.group(1).strip())),

    # UPI/P2M/<ref>/<merchant>/<bank> — UPI person-to-merchant
    (re.compile(r"^UPI[/\-]P2M[/\-][\d]*[/\-]([A-Za-z][^/\n]*?)[/\-]", re.IGNORECASE),
     lambda m, s: _clean_p2_name(m.group(1).strip())),

    # IMPS/P2A/<ref>/<name>/<bank_code>/ — IMPS person-to-account
    # Bank-code-only and digit-only names fall back to "IMPS Transfer".
    (re.compile(r"^IMPS[/\-]P2A[/\-][\d]+[/\-]([^/]+)[/\-]", re.IGNORECASE),
     _imps_p2a_handler),

    # ECOM PUR/<merchant>/<city>/<date>/<time> — E-commerce purchase
    (re.compile(r"^ECOM\s*PUR[/\-]([^/]+)[/\-]", re.IGNORECASE),
     lambda m, s: _clean_merchant(m.group(1))),

    # POS/<merchant>/<city>/<date>/<time> — Point of sale
    (re.compile(r"^POS[/\-]([^/]+)[/\-]", re.IGNORECASE),
     lambda m, s: _clean_entity(m.group(1).strip())),

    # ATM-CASH/<bank_name>/<city>/<date> — ATM withdrawal
    (re.compile(r"^ATM[-/]CASH[/\-]([^/]+)[/\-]", re.IGNORECASE),
     lambda m, s: f"ATM Withdrawal - {_clean_entity(m.group(1).strip())}"),

    # BRN-PYMT-CARD-<card_number> — Branch card payment
    (re.compile(r"^BRN-PYMT-CARD-[\d]+", re.IGNORECASE),
     lambda m, s: "Card Payment"),
]


def _apply_axis_rules(text: str):
    """Return a cleaned string if any Axis Bank pattern matches, else None."""
    for pattern, handler in _AXIS_PATTERNS:
        m = pattern.match(text)
        if m:
            return handler(m, text)
    return None


def _apply_brand_fix(result: str) -> str:
    """Apply final brand normalization to any cleaned result."""
    return _BRAND_FIX.get(result.lower(), result)


# ── Public function ───────────────────────────────────────────────────────────

def clean_narration(raw: str) -> str:
    """
    Convert a raw bank narration string into a readable name/description.

    Examples:
        "UPI/9876543210/RAMESH KUMAR CONST"              → "Ramesh Kumar Const"
        "NEFT/HDFC0001/MR SHARMA BUILDERS"               → "Mr Sharma Builders"
        "MOB/SELFFT/SHIV ABHISHEK P/9160200..."          → "Self Transfer - Shiv Abhishek P"
        "MOB/TPFT/SHIV ABHISHEK P/9160200..."            → "Self Transfer - Shiv Abhishek P"
        "ECOM PUR/ONE97\\nCOMMUNI/NOIDA/210522/16:06"    → "Paytm"
        "ECOM PUR/NETFLIX/MUMBAI/191121/23:26"           → "Netflix"
        "ATM-CASH/INDUSIND BANK LIMI/BHOPAL/180222"      → "ATM Withdrawal - IndusInd Bank"
        "IMPS/P2A/123456/BANKOF/ANDHRAB/"                → "IMPS Transfer"
        "P2a - - Raja - India Pos - Na"                  → "Raja"
        "P2m - - Amazon Pa - Axis Bank - You Are"        → "Amazon Pay"
        "Youtube"                                        → "YouTube"
    """
    if not raw:
        return raw

    # Normalize embedded newlines (pdfplumber can insert \n inside cells)
    text = raw.strip().replace("\n", " ").replace("\r", " ")
    text = _EXTRA_SPACES.sub(" ", text)

    # Special readable cases — keep as-is (just title-case)
    lower = text.lower()
    if any(k in lower for k in [
        "interest", "charges", "gst", "tax", "opening balance",
        "closing balance", "annual fee", "min bal"
    ]):
        return _title(text)

    # P2A/P2M already normalized by pdfplumber cell joining
    # e.g. "P2a - - Raja - India Pos - Na"
    p2_m = _P2_CELL_RE.match(text)
    if p2_m:
        return _apply_brand_fix(_clean_p2_name(p2_m.group(1).strip()))

    # Axis Bank specific patterns (AXMOB, SELFFT, TPFT, EMI, Int.Pd, ECOM PUR, …)
    axis_result = _apply_axis_rules(text)
    if axis_result:
        return _apply_brand_fix(axis_result)

    # ATM — simplify to location if present (generic fallback)
    if re.match(r"^ATM", text, re.IGNORECASE):
        loc_match = re.search(r"(?:ATM\s+WDL[/\-])([\w\s]+?)(?:[/\-]|$)",
                              text, re.IGNORECASE)
        if loc_match:
            loc = loc_match.group(1).strip()
            if len(loc) > 3 and not re.match(r"^[\d]+$", loc):
                return f"ATM Withdrawal - {_title(loc)}"
        return "ATM Withdrawal"

    # Strip prefixes iteratively (some narrations stack multiple prefixes)
    for _ in range(4):
        stripped = _PREFIX_RE.sub("", text).strip(" /|-")
        if stripped == text:
            break
        text = stripped

    # Remove trailing ref numbers
    text = _NOISE_SUFFIXES.sub("", text).strip()

    # Remove embedded account numbers
    text = _ACCOUNT_NUMBER.sub("", text).strip()

    # Normalize slashes → space dash space
    text = _SLASH_SPACE.sub(" - ", text).strip(" -")

    # Clean extra whitespace
    text = _EXTRA_SPACES.sub(" ", text).strip()

    # If nothing meaningful left, return original title-cased
    if len(text) < 3:
        return _title(raw)

    return _apply_brand_fix(_title(text))
