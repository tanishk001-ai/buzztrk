// A winding path with an avatar marker positioned by progress — a "journey"
// toward a savings goal, not a plain progress bar. The marker's position is
// linearly interpolated along a fixed set of waypoints, proportional to
// cumulative distance walked (not just waypoint index), so movement speed
// reads evenly along the whole path regardless of how the waypoints bend.

const WAYPOINTS = [
  [16, 118],
  [76, 46],
  [146, 104],
  [212, 34],
  [280, 92],
  [304, 24],
]

function segmentLengths(points) {
  const lens = []
  for (let i = 0; i < points.length - 1; i++) {
    const [x1, y1] = points[i]
    const [x2, y2] = points[i + 1]
    lens.push(Math.hypot(x2 - x1, y2 - y1))
  }
  return lens
}

function pointAtProgress(points, t) {
  const lens = segmentLengths(points)
  const total = lens.reduce((a, b) => a + b, 0)
  let dist = Math.max(0, Math.min(1, t)) * total
  for (let i = 0; i < lens.length; i++) {
    const isLast = i === lens.length - 1
    if (dist <= lens[i] || isLast) {
      const frac = lens[i] > 0 ? Math.min(1, dist / lens[i]) : 0
      const [x1, y1] = points[i]
      const [x2, y2] = points[i + 1]
      return [x1 + (x2 - x1) * frac, y1 + (y2 - y1) * frac]
    }
    dist -= lens[i]
  }
  return points[points.length - 1]
}

export default function JourneyPath({ pct, emoji = '🚶', color = 'var(--color-good)', destinationEmoji = '🏁' }) {
  const t = Math.max(0, Math.min(100, pct)) / 100
  const [mx, my] = pointAtProgress(WAYPOINTS, t)
  const pathD = WAYPOINTS.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ')
  const [endX, endY] = WAYPOINTS[WAYPOINTS.length - 1]

  return (
    <svg viewBox="0 0 320 140" className="w-full h-auto">
      {/* Full route, dotted — the road not yet (or already) traveled */}
      <path d={pathD} fill="none" stroke="var(--color-base-700)" strokeWidth="4" strokeLinecap="round" strokeDasharray="1 10" />
      {/* Solid overlay revealing only the portion actually traveled */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        pathLength="100"
        strokeDasharray="100"
        strokeDashoffset={100 - t * 100}
        style={{ transition: 'stroke-dashoffset 600ms ease-out' }}
      />
      <text x={endX} y={endY - 12} textAnchor="middle" fontSize="18">
        {destinationEmoji}
      </text>
      <g style={{ transition: 'transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1)' }} transform={`translate(${mx}, ${my})`}>
        <circle r="13" fill="var(--color-base-900)" stroke={color} strokeWidth="2.5" />
        <text textAnchor="middle" dominantBaseline="central" fontSize="14">
          {emoji}
        </text>
      </g>
    </svg>
  )
}
