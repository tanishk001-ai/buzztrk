# SGC Parser Reference (read-only)

These two files are untouched copies from a client project (Shiv Gayatri Core
`bank_tool`), kept here only for reference. They are **not imported or built**
by BuzzTrk — the app never executes Python.

- `parser.py` — pdfplumber-based PDF table/text extraction into `Transaction` records.
- `cleaner.py` — regex-based narration cleaning (strips UPI/NEFT/IMPS/ATM prefixes, title-cases, fixes known brand names).
- `sample_statement_HDFC_Apr2025.pdf` — sample statement used to sanity-check the port below.

BuzzTrk's actual, runtime parser is a JS port adapted for this project's needs
(personal spend categorization instead of an accountant-facing Excel export):

- `src/lib/statementParser.js` — ports `parser.py`'s regex/text extraction
  strategy (line-based date + amount detection), using `pdfjs-dist` to get
  page text in the browser instead of `pdfplumber` server-side table extraction.
- `src/lib/narrationCleaner.js` — direct port of `cleaner.py`'s prefix-stripping
  and title-casing rules (UPI/NEFT/IMPS/ATM/POS/Axis-specific patterns).
- `src/lib/categorize.js` — new logic, not present in the original tool: maps
  a cleaned narration/merchant name to a personal spend category (Food
  Delivery, Eating Out, Transport, Subscriptions, etc.) for the dashboard,
  budgets, and Wrapped recap.

The original client tool at `shiv gayatri core/bank_tool` was not modified in
any way to produce this.
