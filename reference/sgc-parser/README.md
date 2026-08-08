# SGC Parser Reference (read-only)

These two files are untouched copies from a client project (Shiv Gayatri Core
`bank_tool`), kept here only for reference. They are **not imported or built**
by BuzzTrk — the app never executes Python.

- `parser.py` — pdfplumber-based PDF table/text extraction into `Transaction` records.
- `cleaner.py` — regex-based narration cleaning (strips UPI/NEFT/IMPS/ATM prefixes, title-cases, fixes known brand names).
- `sample_statement_HDFC_Apr2025.pdf` — sample statement used to sanity-check the port below.

BuzzTrk's actual, runtime parser is a JS port adapted for this project's needs
(personal spend categorization instead of an accountant-facing Excel export):

- `src/lib/statementParser.js` — ports `parser.py`'s column-aware table
  extraction (its primary strategy) using `pdfjs-dist` text-item positions
  in the browser instead of `pdfplumber` table objects server-side, plus a
  regex line-fallback for headerless layouts. Column assignment is
  shape-based (date-like / amount-like / text) rather than pure x-proximity,
  which pdfplumber's ruled-table detection gets for free from real borders.
- `src/lib/narrationCleaner.js` — direct port of `cleaner.py`'s prefix-stripping
  and title-casing rules (UPI/NEFT/IMPS/ATM/POS/Axis-specific patterns), with
  two small correctness fixes found while stress-testing against a second,
  differently-formatted sample statement: the UPI/IMPS/PhonePe/Paytm numeric
  prefix-stripper no longer eats a leading digit off a merchant name like
  "1mg" (it was turning "UPI-1mg Pharmacy" into "Mg Pharmacy"), and title-casing
  now capitalizes each hyphen-joined segment of a word, not just its first
  letter (was turning "Payment-Landlord" into "Payment-landlord").
- `src/lib/categorize.js` — new logic, not present in the original tool: maps
  a cleaned narration/merchant name to a personal spend category (Eating Out,
  Groceries, Income, Cash Withdrawal, etc.) for the dashboard, budgets, and
  Wrapped recap. Income and cash withdrawal are recognized as their own
  categories rather than falling into "Other" — income is also excluded
  from spend totals.
- `public/sample-statement-2.pdf` — a second, synthetic statement (different
  bank, dash-separated "05-Aug-2026" style dates, single Amount column with
  a trailing Dr/Cr suffix instead of separate Debit/Credit columns) used to
  verify the parser generalizes beyond the one clean HDFC layout it was
  originally built against. It found and fixed a real gap: the date parser
  didn't recognize dash-separated day-month-name-year dates at all.

The original client tool at `shiv gayatri core/bank_tool` was not modified in
any way to produce this.
