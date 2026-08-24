import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppState } from '../state/AppState'
import { BackButton, Button, Card, formatINR, formatDate } from '../components/ui'
import { Icon } from '../components/icons'
import { categorize, categoryMeta } from '../lib/categorize'

export default function UploadStatement() {
  const { addUploadedTransactions, earnPoints } = useAppState()
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const [status, setStatus] = useState('idle') // idle | parsing | done | error
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleFile = async (file) => {
    if (!file) return
    setStatus('parsing')
    setError('')
    try {
      const { parseStatementPdf } = await import('../lib/statementParser')
      const { transactions, accountDisplay } = await parseStatementPdf(file)
      const categorized = transactions.map((t) => ({
        ...t,
        category: categorize(t.description, t.credit > 0 ? 'credit' : 'debit'),
      }))
      setResult({ transactions: categorized, accountDisplay, fileName: file.name })
      setStatus('done')
    } catch (err) {
      console.error(err)
      setError('Could not read that PDF — try the sample statement or a different file.')
      setStatus('error')
    }
  }

  const confirmImport = () => {
    if (!result) return
    addUploadedTransactions(result.transactions)
    earnPoints(40, `Imported statement (${result.transactions.length} txns)`)
    navigate('/')
  }

  return (
    <div className="px-5 pt-6">
      <div className="flex items-start gap-3 mb-1">
        <BackButton className="mt-0.5" />
        <h1 className="font-display text-2xl">Upload statement</h1>
      </div>
      <p className="text-base-400 text-sm mb-6">
        This actually parses your PDF in the browser — nothing is uploaded anywhere. It reads dates, amounts and
        narrations, then cleans and categorizes each transaction.
      </p>

      {status !== 'done' && (
        <Card className="border-2 border-dashed border-base-700 bg-transparent flex flex-col items-center py-10 text-center">
          <div className="text-base-400 mb-3">
            <Icon name="document" size={40} strokeWidth={1.4} />
          </div>
          <p className="font-semibold mb-1">
            {status === 'parsing' ? 'Reading your statement…' : 'Drop a bank statement PDF'}
          </p>
          <p className="text-base-400 text-sm mb-5">Or use the bundled sample HDFC statement to try it out.</p>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => fileRef.current?.click()} disabled={status === 'parsing'}>
              Choose PDF
            </Button>
            <Button
              onClick={async () => {
                setStatus('parsing')
                setError('')
                try {
                  const res = await fetch('/sample-statement.pdf')
                  const blob = await res.blob()
                  const file = new File([blob], 'sample-statement.pdf', { type: 'application/pdf' })
                  await handleFile(file)
                } catch {
                  setError('Sample file failed to load.')
                  setStatus('error')
                }
              }}
              disabled={status === 'parsing'}
            >
              Try sample
            </Button>
          </div>
          {error && <p className="text-cat-food text-sm mt-4">{error}</p>}
        </Card>
      )}

      {status === 'done' && result && (
        <div>
          <Card className="mb-4">
            <p className="text-sm text-base-400">Account</p>
            <p className="font-semibold">{result.accountDisplay}</p>
            <p className="text-sm text-base-400 mt-2">
              Found <span className="text-base-50 font-semibold">{result.transactions.length}</span> transactions in{' '}
              {result.fileName}
            </p>
          </Card>

          {result.transactions.length === 0 ? (
            <Card>
              <p className="text-base-400 text-sm">
                Couldn't detect transaction rows in this PDF's text layout. Try the bundled sample to see the flow.
              </p>
            </Card>
          ) : (
            <Card className="p-0 overflow-hidden max-h-80 overflow-y-auto">
              {result.transactions.map((t, i) => {
                const meta = categoryMeta(t.category)
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 px-5 py-3 ${i !== result.transactions.length - 1 ? 'border-b border-base-700' : ''}`}
                  >
                    <Icon name={meta.emoji} size={18} color={meta.color} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.description}</p>
                      <p className="text-xs text-base-400">{formatDate(t.date)} · {meta.label}</p>
                    </div>
                    <p className={`font-numeral text-sm font-bold ${t.debit > 0 ? 'text-base-50' : 'text-cat-groceries'}`}>
                      {t.debit > 0 ? '-' : '+'}
                      {formatINR(t.debit > 0 ? t.debit : t.credit)}
                    </p>
                  </div>
                )
              })}
            </Card>
          )}

          <div className="flex gap-2 mt-5">
            <Button variant="ghost" className="flex-1" onClick={() => { setStatus('idle'); setResult(null) }}>
              Try another
            </Button>
            <Button className="flex-1" onClick={confirmImport} disabled={result.transactions.length === 0}>
              Import all
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
