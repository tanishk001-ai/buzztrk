// Ports parser.py's column-aware table extraction (its primary strategy)
// into the browser: pdfplumber's ruled-table detection isn't available
// client-side, but pdf.js exposes each text item's x/y position, and this
// sample-statement family renders one text item per cell — so the header
// row's x-positions double as column boundaries, exactly like parser.py's
// `_extract_from_table` uses header cell indices. Falls back to parser.py's
// regex line strategy (`_extract_from_text`) when no header row is found.
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url'
import { cleanNarration } from './narrationCleaner'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

const MONTH_MAP = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
}

const DATE_PATTERNS = [
  { re: /^(\d{2})[/\-.](\d{2})[/\-.](\d{4})$/, kind: 'dmY' },
  // "5 Aug 2026", "05-Aug-2026", "05/Aug/2026" — space, dash, or slash between parts
  { re: /^(\d{1,2})[\s\-/]+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\-/]+(\d{4})$/i, kind: 'dmmmY' },
  { re: /^(\d{4})[/\-.](\d{2})[/\-.](\d{2})$/, kind: 'Ymd' },
  { re: /^(\d{2})[/\-.](\d{2})[/\-.](\d{2})$/, kind: 'dmy' },
]

function parseDate(raw) {
  const str = (raw || '').trim()
  for (const { re, kind } of DATE_PATTERNS) {
    const m = re.exec(str)
    if (!m) continue
    let d, mo, y
    if (kind === 'dmmmY') {
      d = m[1].padStart(2, '0')
      mo = MONTH_MAP[m[2].toLowerCase().slice(0, 3)] || '01'
      y = m[3]
    } else if (kind === 'dmY') {
      ;[, d, mo, y] = m
    } else if (kind === 'dmy') {
      ;[, d, mo] = m
      y = `20${m[3]}`
    } else if (kind === 'Ymd') {
      ;[, y, mo, d] = m
    }
    const date = new Date(Number(y), Number(mo) - 1, Number(d))
    if (!Number.isNaN(date.getTime())) return date
  }
  return null
}

function parseAmount(raw) {
  if (raw == null) return null
  let s = String(raw).trim()
  s = s.replace(/[₹$,\s]/g, '')
  s = s.replace(/(dr|cr)$/i, '')
  if (!s || s === '-' || s === '–') return null
  const n = parseFloat(s)
  return Number.isNaN(n) ? null : Math.abs(n)
}

// ── Header synonym matching (ports HEADER_SYNONYMS / _match_col) ───────────
const HEADER_SYNONYMS = {
  date: ['date', 'txn date', 'trans date', 'value date', 'posting date', 'transaction date'],
  description: ['description', 'narration', 'particulars', 'remarks', 'transaction details', 'details', 'chq/ref', 'reference', 'transaction remarks'],
  debit: ['debit', 'dr', 'withdrawal', 'withdrawals', 'debit amount', 'amount debited', 'dr amount'],
  credit: ['credit', 'cr', 'deposit', 'deposits', 'credit amount', 'amount credited', 'cr amount'],
  balance: ['balance', 'closing balance', 'running balance', 'avl balance', 'available balance'],
  amount: ['amount', 'transaction amount'],
}

function matchCol(header, key) {
  const h = header.trim().toLowerCase()
  for (const syn of HEADER_SYNONYMS[key] || []) {
    if (h === syn) return true
    const re = new RegExp(`(?<![a-z])${syn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-z])`)
    if (re.test(h)) return true
  }
  return false
}

// ── Page text -> rows of {text, x, xCenter} grouped by y position ──────────
async function pageToRows(page) {
  const content = await page.getTextContent()
  const groups = []
  for (const item of content.items) {
    if (!item.str || !item.str.trim()) continue
    const y = item.transform[5]
    let group = groups.find((g) => Math.abs(g.y - y) <= 3)
    if (!group) {
      group = { y, items: [] }
      groups.push(group)
    }
    group.items.push({
      text: item.str.trim(),
      x: item.transform[4],
      xCenter: item.transform[4] + (item.width || 0) / 2,
    })
  }
  groups.sort((a, b) => b.y - a.y)
  for (const g of groups) g.items.sort((a, b) => a.x - b.x)
  return groups
}

const HEADER_KEYWORDS = ['date', 'narration', 'description', 'particulars', 'debit', 'credit', 'withdrawal']

function findHeaderRow(rows) {
  for (let i = 0; i < Math.min(rows.length, 8); i++) {
    const rowText = rows[i].items.map((it) => it.text.toLowerCase()).join(' ')
    if (HEADER_KEYWORDS.some((kw) => rowText.includes(kw))) return i
  }
  return -1
}

function buildColumnMap(headerRow) {
  const cols = {}
  for (const key of ['date', 'description', 'debit', 'credit', 'balance', 'amount']) {
    const item = headerRow.items.find((it) => matchCol(it.text, key))
    if (item) cols[key] = item.xCenter
  }
  return cols
}

function nearestColumn(xCenter, columnMap, keys) {
  let best = null
  let bestDist = Infinity
  for (const key of keys) {
    if (!(key in columnMap)) continue
    const dist = Math.abs(xCenter - columnMap[key])
    if (dist < bestDist) {
      bestDist = dist
      best = key
    }
  }
  return best
}

const AMOUNT_LIKE_RE = /^-?[\d,]+\.\d{1,2}(?:\s*(?:dr|cr))?$/i
const NUMERIC_KEYS = ['debit', 'credit', 'balance', 'amount']

// Classifies each cell by shape (date / amount / text) rather than pure
// x-proximity — a short, left-aligned description like "UPI-Ola Cab" sits
// far left of a wide Description column's header text, so matching it to
// the nearest header x-position (as the original table strategy effectively
// does via ruled column boundaries) misfires. Numeric cells are narrow and
// reliably close to their true column x, so proximity works fine for those.
function extractFromTableRows(dataRows, columnMap) {
  const txns = []
  for (const row of dataRows) {
    const cells = { date: '', description: '', debit: '', credit: '', balance: '', amount: '' }
    let dateAssigned = false
    for (const item of row.items) {
      const text = item.text.trim()
      if (!dateAssigned && parseDate(text)) {
        cells.date = text
        dateAssigned = true
      } else if (AMOUNT_LIKE_RE.test(text)) {
        const col = nearestColumn(item.xCenter, columnMap, NUMERIC_KEYS)
        if (col) cells[col] = cells[col] ? `${cells[col]} ${text}` : text
      } else {
        cells.description = cells.description ? `${cells.description} ${text}` : text
      }
    }
    const dt = parseDate(cells.date)
    if (!dt) continue

    let debit = parseAmount(cells.debit) || 0
    let credit = parseAmount(cells.credit) || 0
    const balance = parseAmount(cells.balance) || 0

    if (debit === 0 && credit === 0 && cells.amount) {
      const v = parseAmount(cells.amount)
      if (v) {
        if (/dr$/i.test(cells.amount.trim())) debit = v
        else if (/cr$/i.test(cells.amount.trim())) credit = v
        else debit = v
      }
    }

    if (debit === 0 && credit === 0) continue // opening/closing balance rows etc.

    txns.push({ date: dt, description: cells.description, debit, credit, balance })
  }
  return txns
}

// ── Regex line fallback (ports parser.py `_extract_from_text`) ─────────────
const LINE_RE = /^(\d{2}[/\-.]\d{2}[/\-.]\d{2,4}|\d{1,2}[\s\-/]+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*[\s\-/]+\d{4}|\d{4}[/\-.]\d{2}[/\-.]\d{2})\s+(.+)$/i
const AMOUNT_RE = /[\d,]+\.\d{2}/g

function extractFromTextLine(line) {
  const m = LINE_RE.exec(line.trim())
  if (!m) return null
  const dt = parseDate(m[1])
  if (!dt) return null

  const rest = m[2]
  const amounts = rest.match(AMOUNT_RE)
  if (!amounts || amounts.length === 0) return null

  let desc = rest.replace(AMOUNT_RE, '').trim().replace(/\s{2,}/g, ' ').replace(/^[|\s/-]+|[|\s/-]+$/g, '')
  const floats = amounts.map((a) => parseFloat(a.replace(/,/g, '')))
  const balance = floats[floats.length - 1] ?? 0
  let debit = 0
  let credit = 0
  if (floats.length >= 3) {
    debit = floats[floats.length - 3]
    credit = floats[floats.length - 2]
  } else if (floats.length === 2) {
    if (/\bdr\b/i.test(rest)) debit = floats[floats.length - 2]
    else if (/\bcr\b/i.test(rest)) credit = floats[floats.length - 2]
  }
  if (debit === 0 && credit === 0) return null

  return { date: dt, description: desc, debit, credit, balance }
}

/**
 * Parse a bank statement PDF File into raw transactions.
 * Returns { transactions, accountDisplay } where transactions are
 * { date: Date, description: string, debit: number, credit: number, balance: number }.
 */
export async function parseStatementPdf(file) {
  const buf = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise

  let allTxns = []
  let fullTextLines = []

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const rows = await pageToRows(page)
    fullTextLines.push(...rows.map((r) => r.items.map((it) => it.text).join(' ')))

    const headerIdx = findHeaderRow(rows)
    if (headerIdx >= 0) {
      const columnMap = buildColumnMap(rows[headerIdx])
      if (columnMap.date) {
        const pageTxns = extractFromTableRows(rows.slice(headerIdx + 1), columnMap)
        allTxns.push(...pageTxns)
        continue
      }
    }
    // Fallback: regex line strategy for this page
    for (const row of rows) {
      const line = row.items.map((it) => it.text).join(' ')
      const txn = extractFromTextLine(line)
      if (txn) allTxns.push(txn)
    }
  }

  const fullText = fullTextLines.join('\n')
  const acctMatch = /(?:Statement of Account No|Account No)[.\s:]*([X\d\s]{6,20})/i.exec(fullText)
  const accountNumber = acctMatch ? acctMatch[1].replace(/\s/g, '').trim() : 'Unknown'
  const accountDisplay =
    accountNumber !== 'Unknown' && accountNumber.length > 4 ? `...${accountNumber.slice(-4)}` : accountNumber

  const seen = new Set()
  const unique = []
  for (const t of allTxns) {
    const key = `${t.date.getTime()}|${t.debit.toFixed(2)}|${t.credit.toFixed(2)}|${t.balance.toFixed(2)}|${t.description}`
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(t)
  }
  unique.sort((a, b) => a.date - b.date)

  const cleaned = unique.map((t) => ({
    ...t,
    description: cleanNarration(t.description),
    rawDescription: t.description,
  }))

  return { transactions: cleaned, accountDisplay }
}
