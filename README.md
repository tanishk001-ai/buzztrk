# BuzzTrk

**Live: [buzztrk.vercel.app](https://buzztrk.vercel.app/#/)**

A personal finance visibility prototype for 15–25 year-olds in India handling
money for the first time — pocket money or an early salary. Built as a PM
portfolio artifact: Vite + React + Tailwind v4, mock data only, no backend,
no real payments.

## Why

First-time earners in this age group often have no visibility into where
their money goes, run out of cash by the second week of the month, and lean
on BNPL apps or informal borrowing to bridge the gap — then spend the next
month paying that back. BuzzTrk exists to make spending visible before the
debt-trap habit forms. It deliberately does **not** do lending, payments
settlement, ads, or spend leaderboards.

## What's real vs. mocked

- **Real**: uploading a bank statement PDF. `src/lib/statementParser.js` and
  `src/lib/narrationCleaner.js` parse the PDF client-side (pdf.js), extract
  dated transaction rows, clean the raw UPI/NEFT/IMPS narration into a
  readable merchant name, and categorize it — see `reference/sgc-parser/`
  for the origin and adaptation notes.
- **Mocked**: the passive auto-collected feed, budgets, dues/EMIs, the Blend
  friend group, streaks/points, and the rewards catalog — all seeded in
  `src/data/mockData.js` with plausible Indian merchants and UPI-style
  descriptions.

## Run locally

```bash
npm install
npm run dev
```

## Design system

Dark neutral base (Spotify-inspired) with one vivid, distinct color per
spend category (FamPay-inspired), bubble-shaped cards and bold numerals
throughout, coin/badge gamification (Pop-inspired) for the streak and points
system, and a signature gradient reserved only for the swipeable Recap
and milestone moments.

## Deploy

Live at [buzztrk.vercel.app](https://buzztrk.vercel.app/#/) — same pattern as
this author's other prototypes: push to GitHub, import into Vercel.
`vercel.json` rewrites all routes to `index.html` for the SPA.
