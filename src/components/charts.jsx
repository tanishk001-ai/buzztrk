// Lightweight, dependency-free bar + donut charts — plain SVG/CSS, no
// charting library. Keeps bundle size in line with the rest of the app
// (modern-screenshot / pdfjs are both lazy-loaded for the same reason).

export function BarChart({ data, height = 140, barWidth = 40, formatValue = (v) => v }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div className="flex items-end gap-3 overflow-x-auto pb-1">
      {data.map((d) => {
        const barHeight = Math.max(3, Math.round((d.value / max) * (height - 32)))
        return (
          <div key={d.label} className="flex flex-col items-center gap-1.5 shrink-0" style={{ width: barWidth }}>
            <span className="text-[10px] text-base-400 font-numeral whitespace-nowrap">{formatValue(d.value)}</span>
            <div
              className="w-full rounded-t-lg transition-all"
              style={{ height: barHeight, backgroundColor: d.color || 'var(--color-cat-groceries)' }}
            />
            <span className="text-[10px] text-base-400 truncate w-full text-center">{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function arcPath(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle)
  const end = polarToCartesian(cx, cy, r, startAngle)
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`
}

export function PieChart({ data, size = 140, donut = true, holeColor = 'var(--color-base-800)', showLegend = true }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const r = size / 2
  const innerR = donut ? r * 0.56 : 0
  let angle = 0
  const slices = data
    .filter((d) => d.value > 0)
    .map((d) => {
      const sliceAngle = total > 0 ? (d.value / total) * 360 : 0
      const slice = { ...d, start: angle, end: angle + sliceAngle }
      angle += sliceAngle
      return slice
    })

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        {slices.length === 1 ? (
          <circle cx={r} cy={r} r={r} fill={slices[0].color} />
        ) : (
          slices.map((s, i) => <path key={i} d={arcPath(r, r, r, s.start, s.end)} fill={s.color} />)
        )}
        {donut && total > 0 && <circle cx={r} cy={r} r={innerR} fill={holeColor} />}
      </svg>
      {showLegend && (
        <div className="flex-1 space-y-1.5 min-w-0">
          {slices.map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-base-200 truncate flex-1">{s.label}</span>
              <span className="text-base-400 font-numeral">{total > 0 ? Math.round((s.value / total) * 100) : 0}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
