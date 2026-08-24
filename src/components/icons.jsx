// A single, custom line-icon set replacing every emoji in the app — one
// visual language (rounded stroke, 1.75px, 24x24 grid) instead of the
// system emoji font, so nav/category/badge glyphs read as *designed*
// rather than defaulted. Ties into the existing identity: icons take
// `currentColor` so they inherit each surface's category/accent hue
// exactly the way the old emoji-tinted circles did, and default to the
// same rounded, bubble-cornered feel as the rest of the UI (round caps/
// joins, no sharp edges).
//
// Deliberately hand-drawn rather than an imported icon pack — a handful of
// shared primitives (circle badge, rounded rect, simple path) cover every
// concept the app needs without pulling in a dependency.

const paths = {
  // ── Nav / structure ──────────────────────────────────────────────────
  home: 'M4 11.5 12 4l8 7.5M6 9.5V20h5v-6h2v6h5V9.5',
  target: 'M12 12m-8 0a8 8 0 1 0 16 0a8 8 0 1 0 -16 0 M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0 M12 12m-0.5 0a0.5 0.5 0 1 0 1 0a0.5 0.5 0 1 0 -1 0',
  receipt: 'M6 3h12v18l-2.5-1.5L13 21l-2.5-1.5L8 21l-2-1.5V3z M9 8h6 M9 12h6 M9 16h4',
  handshake: 'M2 12l4-4 4 3 3-3 3 3 4-4 2 2-5 6-4-3-3 3-4-3z M9 15l2 2 M13 15l2 2',
  sparkles: 'M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z M5 16l0.8 2.2L8 19l-2.2 0.8L5 22l-0.8-2.2L2 19l2.2-0.8z M19 15l0.7 1.8L21.5 17.5l-1.8 0.7L19 20l-0.7-1.8L16.5 17.5l1.8-0.7z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4.5 20.5c1.5-4 4-6 7.5-6s6 2 7.5 6',
  settings: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z M12 3.5v2 M12 18.5v2 M4.4 6.4l1.4 1.4 M18.2 16.2l1.4 1.4 M3.5 12h2 M18.5 12h2 M4.4 17.6l1.4-1.4 M18.2 7.8l1.4-1.4',

  // ── Categories ───────────────────────────────────────────────────────
  'trending-up': 'M4 16l5-5 4 4 7-8 M15 7h5v5',
  utensils: 'M7 3v7a2 2 0 0 0 4 0V3 M9 3v18 M9 10V3 M17 3c-1.2 0-2 1.5-2 4s.8 4 2 4v11',
  basket: 'M4 9h16l-1.5 10a2 2 0 0 1-2 1.7H7.5a2 2 0 0 1-2-1.7L4 9z M8 9l2-5h4l2 5 M9 13v4 M12 13v4 M15 13v4',
  car: 'M4 16V11l2-5h12l2 5v5 M4 16h16 M7 16v2.5 M17 16v2.5 M6.5 13h11 M7.5 13.5m-1.2 0a1.2 1.2 0 1 0 2.4 0a1.2 1.2 0 1 0 -2.4 0 M16.5 13.5m-1.2 0a1.2 1.2 0 1 0 2.4 0a1.2 1.2 0 1 0 -2.4 0',
  bag: 'M6 8h12l1 12.5H5L6 8z M9 8V6a3 3 0 0 1 6 0v2',
  tv: 'M4 5h16v11H4z M9 20h6 M12 16v4',
  film: 'M4 4h16v16H4z M8 4v16 M16 4v16 M4 9h4 M4 15h4 M16 9h4 M16 15h4',
  heart: 'M12 20.5s-7.5-4.6-9.6-9.3C.9 7.7 3 4.5 6.4 4.5c2 0 3.4 1 5.6 3.3 2.2-2.3 3.6-3.3 5.6-3.3 3.4 0 5.5 3.2 4 6.7C19.5 15.9 12 20.5 12 20.5z',
  pulse: 'M2 12h4l2-6 4 12 2-9 2 3h6',
  banknote: 'M3 7h18v10H3z M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z M6 7v10 M18 7v10',
  swap: 'M6 7h13l-3-3 M19 17H6l3 3',
  card: 'M3 6h18v12H3z M3 10h18 M6.5 14.5h4',
  tag: 'M12.5 3H4v8.5L14 21l8-8L12.5 3z M8 8m-1.2 0a1.2 1.2 0 1 0 2.4 0a1.2 1.2 0 1 0 -2.4 0',
  phone: 'M7 3h10a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z M11 18h2',
  zap: 'M13 2 4 14h6l-1 8 9-12h-6z',
  clipboard: 'M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1z M6 6h12v15H6z M9 11h6 M9 15h6',

  // ── Common UI ────────────────────────────────────────────────────────
  close: 'M6 6l12 12 M18 6L6 18',
  check: 'M5 13l4 4L19 7',
  'check-circle': 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M8 12.5l2.5 2.5L16 9',
  plus: 'M12 5v14 M5 12h14',
  'eye-off': 'M3 3l18 18 M10.6 10.7a2.6 2.6 0 0 0 3.7 3.6 M6.4 6.8C4.2 8.2 2.7 10.2 2 12c1.8 4.2 5.6 7 10 7 1.6 0 3.1-.4 4.5-1.1 M9.8 4.7c.7-.1 1.4-.2 2.2-.2 4.4 0 8.2 2.8 10 7-.5 1.2-1.3 2.4-2.2 3.4',
  share: 'M12 3v13 M7 8l5-5 5 5 M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4',
  warning: 'M12 3l10 18H2L12 3z M12 10v4 M12 17.2h.01',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.35-4.35',
  compass: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M15 9l-2 6-4 2 2-6z',
  history: 'M3 12a9 9 0 1 0 3-6.7 M3 4v5h5 M12 8v4l3 2',
  flame: 'M12 22c4 0 7-2.7 7-6.8 0-3-1.8-4.7-2.7-6.5C15.3 6.5 14.6 4 12 2c.3 3-1.6 4.6-3 6.5C7.6 10.4 6.8 12.2 6.8 15c0 1.7.6 3 1.5 4-1.4-.4-2.3-1.3-2.3-1.3C5.5 20.3 8.2 22 12 22z',
  star: 'M12 2.5l2.9 6 6.6.7-4.9 4.5 1.3 6.5L12 16.9l-5.9 3.3 1.3-6.5-4.9-4.5 6.6-.7z',
  party: 'M3 21l4-11 8 8-11 3z M9.5 12.5l-1-4.5 M14.5 9.5l3-2 M11 5l1-2.5 M18 12l2.5 1',
  crown: 'M4 18h16 M4 18l-1.5-9L8 12l4-7 4 7 5.5-3L20 18',
  running: 'M14.2 5.5a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4z M9 21l2-5 2.5 2 2.5-1 M6 15l3-3 2.5 1 2-4-2.5-2-3.5 1-2.5 3.5',
  users: 'M8 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z M2.5 20c.7-3.3 2.8-5 5.5-5s4.8 1.7 5.5 5 M16.5 8a3 3 0 1 1 0-6 M15 20c.3-2.7 1.6-4.5 3.5-5 2 .5 3.2 2.3 3.5 5',
  scale: 'M12 3v18 M8 21h8 M5 7l3.5-1.5L12 7 M19 7l-3.5-1.5L12 7 M2 7l3 7 3-7-3-1z M16 7l3 7 3-7-3-1z',
  shuffle: 'M4 6h3.5l7 12H18 M4 18h3.5l2.2-3.8 M14.5 6H18 M16 3l3 3-3 3 M16 15l3 3-3 3',
  plane: 'M11 3l2 6 6 2-6 1-2 6-1-5-6-1 6-2z M4 20l4-2',
  building: 'M5 21V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v16 M13 21v-8h6v8 M8 8h1 M8 12h1 M8 16h1',
  piggy: 'M4.5 12a5.5 5.5 0 0 1 5.5-5.5h4.5a5 5 0 0 1 4 2h1.5l-1 2.5-1.5.5v2l1.5 3H16l-1-2H9.5l-1.5 2H5l1-3a5.5 5.5 0 0 1-1.5-3.7z M8 10.2h.01 M9 6.5V4.5l2 1.5',
  trophy: 'M7 4h10v5a5 5 0 0 1-10 0V4z M5 6H3v1a4 4 0 0 0 4 4 M19 6h2v1a4 4 0 0 1-4 4 M9 21h6 M12 15v3 M8 21h8',
  gift: 'M4 9h16v4H4z M6 13v8h12v-8 M12 9v12 M12 9c-1 0-3-.5-3-2.5S10.5 4 12 6c1.5-2 3-1 3 .5S13 9 12 9z',
  palette: 'M12 3a9 9 0 1 0 0 18c1.4 0 2-.9 2-2 0-.6-.3-1-.5-1.4-.3-.5-.1-1.1.5-1.3.5-.2 1-.3 1.5-.3a4 4 0 0 0 4-4c0-5-3.6-9-7.5-9z M7.5 12.5m-1.1 0a1.1 1.1 0 1 0 2.2 0a1.1 1.1 0 1 0 -2.2 0 M9 8.5m-1.1 0a1.1 1.1 0 1 0 2.2 0a1.1 1.1 0 1 0 -2.2 0 M14 7.5m-1.1 0a1.1 1.1 0 1 0 2.2 0a1.1 1.1 0 1 0 -2.2 0 M17 10.5m-1.1 0a1.1 1.1 0 1 0 2.2 0a1.1 1.1 0 1 0 -2.2 0',
  laptop: 'M4 5h16v9H4z M2 19h20 M9 19l1-2h4l1 2',
  cap: 'M2 9l10-4 10 4-10 4z M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5 M22 9v6',
  ticket: 'M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z M13 6v2 M13 11v2 M13 16v2',
  footprints: 'M8 4a2 2 0 0 1 2 2v2a2 2 0 1 1-4 0V6a2 2 0 0 1 2-2z M16 10a2 2 0 0 1 2 2v2a2 2 0 1 1-4 0v-2a2 2 0 0 1 2-2z M6.5 12.5c1 .8 1.5 1.8 1.5 3.5 M17.5 18.5c-1-.8-1.5-1.8-1.5-3.5',
  flag: 'M6 3v18 M6 4h13l-2.5 4L19 12H6',
  smile: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M8.5 10.5h.01 M15.5 10.5h.01 M8 14.5c1 1.3 2.3 2 4 2s3-.7 4-2',
  document: 'M7 3h7l4 4v14H7z M14 3v4h4 M9.5 12h5 M9.5 15.5h5 M9.5 8.5h2',
  medal: 'M12 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10z M9 6 6.5 2H10l2 3 M15 6 17.5 2H14l-2 3 M12 8.5l1.2 2.5 2.7.3-2 1.9.5 2.7-2.4-1.3-2.4 1.3.5-2.7-2-1.9 2.7-.3z',
  repeat: 'M4 12a8 8 0 0 1 14-5.3L20 8 M20 12a8 8 0 0 1-14 5.3L4 16 M17 3v5h-5 M7 21v-5h5',
}

// Two-tone / filled icons that don't fit the plain-stroke pattern above.
function CustomIcon({ name, strokeWidth }) {
  if (name === 'coin-badge') {
    return (
      <>
        <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity="0.18" />
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={strokeWidth} />
        <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth={strokeWidth} strokeOpacity="0.65" />
      </>
    )
  }
  return null
}

/**
 * One consistent icon component for the whole app — pass a `name` from the
 * set above. `size` sets both dimensions; `color` defaults to the
 * surrounding text color (`currentColor`) so a category/accent color
 * applied via CSS `color` (or an inline `style`) tints the icon exactly the
 * way the old colored-circle-behind-emoji treatment did.
 */
export function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 1.75, className = '' }) {
  const d = paths[name]
  if (!d && name !== 'coin-badge') return null
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      style={{ color }}
      aria-hidden="true"
    >
      {d ? (
        <path d={d} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <CustomIcon name={name} size={size} strokeWidth={strokeWidth} />
      )}
    </svg>
  )
}

// Round, tinted badge behind an icon — the standard "icon chip" used for
// category glyphs, empty states, and celebratory markers throughout the
// app, replacing the old `color-mix(...) + emoji` circles one-for-one.
export function IconBadge({ name, color = 'var(--color-cat-other)', size = 40, iconSize, className = '' }) {
  return (
    <div
      className={`rounded-full flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size, backgroundColor: `color-mix(in srgb, ${color} 22%, transparent)`, color }}
    >
      <Icon name={name} size={iconSize || Math.round(size * 0.52)} />
    </div>
  )
}
