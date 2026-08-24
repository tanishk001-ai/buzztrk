import { useState } from 'react'
import { Icon } from './icons'

// Screenshot-style export of a card DOM node — not a real social API
// integration. Lazy-loads modern-screenshot (only paid for when actually
// used, same lazy pattern as the pdf.js statement parser). Deliberately
// not html2canvas: it reimplements CSS parsing and can't handle oklab()/
// color-mix(), which Tailwind v4's own generated color utilities use
// internally — modern-screenshot renders through an SVG <foreignObject>
// instead, so it uses the browser's real rendering rather than an old
// re-implementation of it.
export default function ShareButton({ targetRef, filename = 'buzztrk-card.png', label = 'Share', shareTitle = 'BuzzTrk', shareText = '', className = '' }) {
  const [status, setStatus] = useState('idle') // idle | busy | done | error

  const handleShare = async (e) => {
    e.stopPropagation()
    e.preventDefault()
    if (!targetRef.current || status === 'busy') return
    setStatus('busy')
    try {
      const { domToBlob } = await import('modern-screenshot')
      const blob = await domToBlob(targetRef.current, {
        backgroundColor: '#0B0B0F',
        scale: 2,
      })
      if (!blob) {
        setStatus('error')
        return
      }
      const file = new File([blob], filename, { type: 'image/png' })
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: shareTitle, text: shareText })
        } catch {
          // user cancelled the share sheet — not an error
        }
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
      setStatus('done')
      setTimeout(() => setStatus('idle'), 1500)
    } catch (err) {
      console.error('Card export failed', err)
      setStatus('error')
      setTimeout(() => setStatus('idle'), 1500)
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={status === 'busy'}
      className={`inline-flex items-center gap-1.5 rounded-full bg-base-900/80 border border-base-700 px-3 py-1.5 text-xs font-semibold backdrop-blur active:scale-95 transition-transform disabled:opacity-50 ${className}`}
    >
      {status === 'busy' ? (
        '…'
      ) : status === 'done' ? (
        <>
          <Icon name="check" size={13} strokeWidth={2.5} /> Saved
        </>
      ) : status === 'error' ? (
        <>
          <Icon name="warning" size={13} strokeWidth={2.5} /> Failed
        </>
      ) : (
        <>
          <Icon name="share" size={13} strokeWidth={2.5} /> {label}
        </>
      )}
    </button>
  )
}
