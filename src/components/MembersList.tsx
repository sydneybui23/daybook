import { useState } from 'react'
import { CircleFadingPlus, Link2, Share2, Check } from 'lucide-react'
import { Avatar } from '../lib/avatars'
import type { Member } from '../lib/types'

export function MembersList({
  circleId,
  circleName,
  members,
  onInvite,
}: {
  circleId: string
  circleName: string
  members: Member[]
  onInvite: (name: string) => void
}) {
  const [inviting, setInviting] = useState(false)
  const [name, setName] = useState('')
  const [copied, setCopied] = useState(false)

  const inviteLink = `${window.location.origin}/invite/${circleId}`

  const submit = () => {
    if (!name.trim()) return
    onInvite(name.trim())
    setName('')
    setInviting(false)
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // clipboard unavailable, ignore
    }
  }

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `Join ${circleName} on daybook`, url: inviteLink })
      } catch {
        // user cancelled the share sheet, ignore
      }
    } else {
      copyLink()
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
      <h3 className="mb-4 text-[13px] uppercase tracking-[0.08em] text-[var(--ink-soft)]">Members</h3>

      <div className="mb-4 flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--line-soft)]/40 p-2 pl-3">
        <Link2 size={14} className="shrink-0 text-[var(--ink-soft)]" />
        <p className="min-w-0 flex-1 truncate text-[12.5px] text-[var(--ink-soft)]">{inviteLink}</p>
        <button
          onClick={copyLink}
          className="flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[12px] text-[var(--ink)] shadow-[0_1px_2px_rgba(0,0,0,0.06)] hover:text-[var(--accent)]"
        >
          {copied ? <Check size={12} /> : <Link2 size={12} />} {copied ? 'Copied' : 'Copy'}
        </button>
        <button
          onClick={shareLink}
          className="flex shrink-0 items-center gap-1 rounded-full bg-[var(--ink)] px-3 py-1.5 text-[12px] text-white"
        >
          <Share2 size={12} /> Share
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {inviting ? (
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-[var(--line)] p-3">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="Friend's name"
              className="min-w-0 flex-1 border-none bg-transparent text-sm outline-none placeholder:text-[var(--ink-soft)]"
            />
            <button
              onClick={submit}
              className="shrink-0 rounded-full bg-[var(--ink)] px-3 py-1 text-xs text-white"
            >
              Invite
            </button>
          </div>
        ) : (
          <button
            onClick={() => setInviting(true)}
            className="flex items-center gap-3 rounded-xl border border-dashed border-[var(--line)] p-3 text-left text-[var(--ink-soft)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            <CircleFadingPlus size={22} strokeWidth={1.6} />
            <span className="text-sm">Invite a friend by name</span>
          </button>
        )}

        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-3 p-3">
            <Avatar name={m.name} color={m.color} size={40} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--ink)]">{m.name}</p>
              <p className="line-clamp-2 text-[12.5px] leading-snug text-[var(--ink-soft)]">{m.journalHint}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
