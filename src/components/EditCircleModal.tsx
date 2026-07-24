import { useState } from 'react'
import { X, Image as ImageIcon, Trash2 } from 'lucide-react'
import { useStore } from '../lib/store'
import { PALETTE } from '../lib/palette'
import { Avatar } from '../lib/avatars'
import { fileToCompressedDataUrl } from '../lib/imageUtils'
import type { Circle } from '../lib/types'

export function EditCircleModal({ circle, onClose }: { circle: Circle; onClose: () => void }) {
  const { updateCircle, removeMember, updateMemberRole } = useStore()
  const [name, setName] = useState(circle.name)
  const [description, setDescription] = useState(circle.description)
  const [cover, setCover] = useState(circle.cover)

  const onFile = async (file: File) => {
    setCover(await fileToCompressedDataUrl(file))
  }

  const save = () => {
    updateCircle(circle.id, { name: name.trim() || circle.name, description: description.trim(), cover })
    onClose()
  }

  const isPhoto = cover.startsWith('data:') || cover.startsWith('/') || cover.startsWith('http')

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm sm:items-center">
      <div className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-4">
          <p className="text-[13px] uppercase tracking-[0.08em] text-[var(--ink-soft)]">Edit circle</p>
          <button onClick={onClose} className="text-[var(--ink-soft)] hover:text-[var(--ink)]">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-6">
          <label className="mb-2 flex h-32 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[var(--line)] text-[var(--ink-soft)]">
            {isPhoto ? (
              <img src={cover} alt="cover" className="h-full w-full object-cover" />
            ) : (
              <span className="flex flex-col items-center gap-1 text-[12.5px]">
                <ImageIcon size={20} />
                Upload a cover photo
              </span>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          </label>
          <div className="flex flex-wrap gap-2">
            {PALETTE.map((p) => (
              <button
                key={p.id}
                title={p.name}
                onClick={() => setCover(p.id)}
                className="h-6 w-6 rounded-full border-2"
                style={{ background: p.hex, borderColor: cover === p.id ? 'var(--ink)' : 'transparent' }}
              />
            ))}
          </div>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Circle name"
            className="mt-4 w-full rounded-xl border border-[var(--line)] p-3 text-sm outline-none focus:border-[var(--accent)]"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this circle for?"
            rows={2}
            className="mt-3 w-full resize-none rounded-xl border border-[var(--line)] p-3 text-sm outline-none focus:border-[var(--accent)]"
          />

          <div className="mt-6">
            <p className="mb-3 text-[13px] uppercase tracking-[0.08em] text-[var(--ink-soft)]">Members & permissions</p>
            <div className="flex flex-col gap-2.5">
              {circle.members.map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-xl border border-[var(--line)] p-2.5">
                  <Avatar name={m.name} color={m.color} size={32} />
                  <p className="min-w-0 flex-1 truncate text-[13.5px] text-[var(--ink)]">{m.name}</p>
                  <select
                    value={m.role ?? 'member'}
                    onChange={(e) => updateMemberRole(circle.id, m.id, e.target.value as 'admin' | 'member')}
                    className="rounded-lg border border-[var(--line)] bg-white px-2 py-1 text-[12px] text-[var(--ink-soft)] outline-none"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    onClick={() => removeMember(circle.id, m.id)}
                    aria-label={`Remove ${m.name}`}
                    className="text-[var(--ink-soft)] hover:text-[var(--accent)]"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button onClick={onClose} className="rounded-full px-4 py-2 text-sm text-[var(--ink-soft)]">
              Cancel
            </button>
            <button onClick={save} className="rounded-full bg-[var(--ink)] px-5 py-2 text-sm text-white">
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
