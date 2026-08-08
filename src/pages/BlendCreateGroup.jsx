import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppState } from '../state/AppState'
import { BackButton, Button, Card } from '../components/ui'
import { MAX_GROUP_MEMBERS } from '../lib/blendLedger'

export default function BlendCreateGroup() {
  const { createBlendGroup } = useAppState()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [memberNames, setMemberNames] = useState([''])

  const maxOthers = MAX_GROUP_MEMBERS - 1 // 'You' always takes one slot

  const updateMember = (i, value) => {
    setMemberNames((prev) => prev.map((n, idx) => (idx === i ? value : n)))
  }

  const addMemberField = () => {
    if (memberNames.length >= maxOthers) return
    setMemberNames((prev) => [...prev, ''])
  }

  const removeMemberField = (i) => {
    setMemberNames((prev) => prev.filter((_, idx) => idx !== i))
  }

  const validNames = memberNames.map((n) => n.trim()).filter(Boolean)
  const canSubmit = name.trim().length > 0 && validNames.length > 0

  const submit = (e) => {
    e.preventDefault()
    if (!canSubmit) return
    const id = createBlendGroup(name, validNames)
    navigate(`/blend/${id}`)
  }

  return (
    <div className="px-5 pt-6">
      <div className="flex items-start gap-3 mb-1">
        <BackButton className="mt-0.5" />
        <h1 className="font-display text-2xl">Create group</h1>
      </div>
      <p className="text-base-400 text-sm mb-6">Up to {MAX_GROUP_MEMBERS} members, including you.</p>

      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="text-xs font-semibold text-base-400 uppercase tracking-wide">Group name</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Hostel Squad, Goa Trip"
            className="w-full mt-2 bg-base-800 border border-base-700 rounded-2xl px-4 py-3 text-base-50 placeholder:text-base-400 outline-none focus:border-cat-groceries"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-base-400 uppercase tracking-wide">Members</label>
          <Card className="mt-2 flex items-center gap-2 !py-3 mb-2 bg-base-900">
            <span className="text-lg">😎</span>
            <span className="text-sm font-medium text-base-400">You (that's automatic)</span>
          </Card>
          <div className="space-y-2">
            {memberNames.map((n, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={n}
                  onChange={(e) => updateMember(i, e.target.value)}
                  placeholder={`Friend ${i + 1}'s name`}
                  className="flex-1 bg-base-800 border border-base-700 rounded-2xl px-4 py-3 text-base-50 placeholder:text-base-400 outline-none focus:border-cat-groceries"
                />
                {memberNames.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMemberField(i)}
                    className="w-10 h-10 rounded-full bg-base-800 border border-base-700 flex items-center justify-center text-base-400 shrink-0"
                    aria-label="Remove member"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          {memberNames.length < maxOthers && (
            <button
              type="button"
              onClick={addMemberField}
              className="w-full border-2 border-dashed border-base-700 rounded-2xl py-3 text-sm font-semibold text-base-400 mt-2 active:scale-[0.98] transition-transform"
            >
              ＋ Add another member
            </button>
          )}
          <p className="text-base-400 text-xs mt-2">
            {validNames.length + 1} / {MAX_GROUP_MEMBERS} members
          </p>
        </div>

        <Button type="submit" className="w-full" disabled={!canSubmit}>
          Create group
        </Button>
      </form>
    </div>
  )
}
