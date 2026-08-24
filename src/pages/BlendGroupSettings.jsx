import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppState } from '../state/AppState'
import { BackButton, Button, Card, Avatar, EmptyState } from '../components/ui'
import { Icon } from '../components/icons'
import { MAX_GROUP_MEMBERS, entryInvolvesMember } from '../lib/blendLedger'

export default function BlendGroupSettings() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const { blendGroups, renameBlendGroup, addGroupMember, removeGroupMember, deleteBlendGroup } = useAppState()
  const group = blendGroups.find((g) => g.id === groupId)

  const [name, setName] = useState(group?.name || '')
  const [newMemberName, setNewMemberName] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  if (!group) {
    return (
      <div className="px-5 pt-6">
        <BackButton fallback="/blend" />
        <EmptyState icon="search" title="Group not found" />
      </div>
    )
  }

  const saveName = () => {
    if (name.trim() && name.trim() !== group.name) renameBlendGroup(group.id, name)
  }

  const submitAddMember = (e) => {
    e.preventDefault()
    if (!newMemberName.trim() || group.members.length >= MAX_GROUP_MEMBERS) return
    addGroupMember(group.id, newMemberName)
    setNewMemberName('')
  }

  const handleDelete = () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true)
      return
    }
    deleteBlendGroup(group.id)
    navigate('/blend')
  }

  return (
    <div className="px-5 pt-6 pb-10">
      <div className="flex items-start gap-3 mb-1">
        <BackButton fallback={`/blend/${group.id}`} className="mt-0.5" />
        <h1 className="font-display text-2xl">Group settings</h1>
      </div>
      <p className="text-base-400 text-sm mb-6">{group.name}</p>

      <section className="mb-6">
        <label className="text-xs font-semibold text-base-400 uppercase tracking-wide">Group name</label>
        <div className="flex items-center gap-2 mt-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={saveName}
            className="flex-1 bg-base-800 border border-base-700 rounded-2xl px-4 py-3 text-base-50 outline-none focus:border-cat-groceries"
          />
          <Button variant="secondary" className="!py-3" onClick={saveName} disabled={!name.trim() || name.trim() === group.name}>
            Save
          </Button>
        </div>
      </section>

      <section className="mb-6">
        <label className="text-xs font-semibold text-base-400 uppercase tracking-wide">Members</label>
        <p className="text-base-400 text-xs mt-1 mb-2">
          Local names only — no invites or accounts. Members who already appear in the ledger can't be removed, to keep past balances accurate.
        </p>
        <Card className="p-0 overflow-hidden mt-2">
          {group.members.map((m, i) => {
            const isMe = m.id === 'me'
            const hasHistory = group.ledger.some((e) => entryInvolvesMember(e, m.id))
            return (
              <div
                key={m.id}
                className={`flex items-center gap-3 px-4 py-3 ${i !== group.members.length - 1 ? 'border-b border-base-700' : ''}`}
              >
                <Avatar name={m.name} color={m.avatarColor} size={32} />
                <p className="flex-1 text-sm font-medium">{m.name}</p>
                {!isMe && (
                  <button
                    type="button"
                    onClick={() => removeGroupMember(group.id, m.id)}
                    disabled={hasHistory}
                    title={hasHistory ? "Can't remove — already part of the ledger" : 'Remove member'}
                    className="w-8 h-8 rounded-full bg-base-900 border border-base-700 flex items-center justify-center text-base-400 shrink-0 disabled:opacity-30 active:scale-95 transition-transform"
                  >
                    <Icon name="close" size={13} />
                  </button>
                )}
              </div>
            )
          })}
        </Card>

        {group.members.length < MAX_GROUP_MEMBERS ? (
          <form onSubmit={submitAddMember} className="flex items-center gap-2 mt-3">
            <input
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              placeholder="Add a member — just a name"
              className="flex-1 bg-base-800 border border-base-700 rounded-2xl px-4 py-3 text-base-50 placeholder:text-base-400 outline-none focus:border-cat-groceries"
            />
            <Button type="submit" variant="secondary" className="!py-3" disabled={!newMemberName.trim()}>
              Add
            </Button>
          </form>
        ) : (
          <p className="text-base-400 text-xs mt-3">Group is at the {MAX_GROUP_MEMBERS}-member limit.</p>
        )}
      </section>

      <section className="pt-4 border-t border-base-700">
        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--color-over)' }}>
          Danger zone
        </p>
        <Button
          variant="ghost"
          className="w-full"
          style={{ color: 'var(--color-over)', borderColor: 'var(--color-over)' }}
          onClick={handleDelete}
        >
          {confirmingDelete ? 'Tap again to permanently delete' : 'Delete group'}
        </Button>
        {confirmingDelete && (
          <button
            type="button"
            onClick={() => setConfirmingDelete(false)}
            className="w-full text-center text-xs font-semibold text-base-400 underline decoration-base-600 mt-2"
          >
            Cancel
          </button>
        )}
      </section>
    </div>
  )
}
