import { useState } from 'react'
import { Button } from './ui'
import { Icon } from './icons'
import { CUSTOM_CATEGORY_COLORS } from '../lib/categorize'

const EMOJI_PRESETS = ['tag', 'gift', 'palette', 'heart', 'plane', 'bag', 'film', 'trophy', 'sparkles', 'basket', 'piggy', 'ticket']

export default function NewCategoryForm({ onCreate, onCancel }) {
  const [label, setLabel] = useState('')
  const [emoji, setEmoji] = useState(EMOJI_PRESETS[0])
  const [color, setColor] = useState(CUSTOM_CATEGORY_COLORS[0])

  const submit = (e) => {
    e.preventDefault()
    if (!label.trim()) return
    onCreate(label.trim(), emoji, color)
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="text-xs font-semibold text-base-400 uppercase tracking-wide">Category name</label>
        <input
          autoFocus
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Gaming"
          className="w-full mt-2 bg-base-900 border border-base-700 rounded-2xl px-4 py-3 text-base-50 placeholder:text-base-400 outline-none focus:border-cat-groceries"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-base-400 uppercase tracking-wide">Icon</label>
        <div className="flex flex-wrap gap-2 mt-2">
          {EMOJI_PRESETS.map((e) => (
            <button
              type="button"
              key={e}
              onClick={() => setEmoji(e)}
              className="w-9 h-9 rounded-full flex items-center justify-center border transition-colors"
              style={{
                borderColor: emoji === e ? 'var(--color-cat-groceries)' : 'var(--color-base-700)',
                backgroundColor: emoji === e ? 'color-mix(in srgb, var(--color-cat-groceries) 20%, transparent)' : 'transparent',
                color: emoji === e ? 'var(--color-cat-groceries)' : 'var(--color-base-200)',
              }}
            >
              <Icon name={e} size={16} />
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-base-400 uppercase tracking-wide">Color</label>
        <div className="flex flex-wrap gap-2 mt-2">
          {CUSTOM_CATEGORY_COLORS.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setColor(c)}
              aria-label={c}
              className="w-8 h-8 rounded-full border-2 transition-transform active:scale-90"
              style={{ backgroundColor: c, borderColor: color === c ? 'var(--color-base-50)' : 'transparent' }}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="ghost" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={!label.trim()}>
          Create category
        </Button>
      </div>
    </form>
  )
}
