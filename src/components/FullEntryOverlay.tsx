import { useState } from 'react'
import { ArrowLeft, Camera, MoreVertical, Pencil } from 'lucide-react'
import { useStore } from '../lib/store'
import { paletteColorForSeed } from '../lib/palette'
import { fileToCompressedDataUrl } from '../lib/imageUtils'
import { Avatar } from '../lib/avatars'
import { CommentThread } from './CommentThread'
import type { PostEntry } from './PostCard'

function fullDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
}

export function FullEntryOverlay({
  entry,
  onBack,
  startInEdit,
}: {
  entry: PostEntry
  onBack: () => void
  startInEdit?: boolean
}) {
  const { profile, entries, updateEntry } = useStore()
  const [displayEntry, setDisplayEntry] = useState(entry)
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(!!startInEdit)
  const [draftSummary, setDraftSummary] = useState(entry.summary)
  const [draftText, setDraftText] = useState(entry.fullText ?? entry.summary)
  const [draftPhoto, setDraftPhoto] = useState(entry.photo)

  const canEdit = displayEntry.name === profile.name && entries.some((e) => e.id === displayEntry.id)

  const startEdit = () => {
    setDraftSummary(displayEntry.summary)
    setDraftText(displayEntry.fullText ?? displayEntry.summary)
    setDraftPhoto(displayEntry.photo)
    setEditing(true)
    setMenuOpen(false)
  }

  const onPhotoFile = async (file: File) => {
    try {
      setDraftPhoto(await fileToCompressedDataUrl(file))
    } catch {
      alert("Couldn't read that photo — try a JPEG, PNG, or screenshot.")
    }
  }

  const save = () => {
    updateEntry(displayEntry.id, {
      summary: draftSummary.trim() || displayEntry.summary,
      freeText: draftText.trim(),
      photo: draftPhoto,
    })
    setDisplayEntry((prev) => ({
      ...prev,
      summary: draftSummary.trim() || prev.summary,
      fullText: draftText.trim(),
      photo: draftPhoto,
    }))
    setEditing(false)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[var(--paper)]">
      <div className="sticky top-0 z-10 flex w-full items-center justify-between bg-[var(--paper)]/95 px-6 py-4 backdrop-blur">
        <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] text-[var(--ink-soft)] hover:text-[var(--ink)]">
          <ArrowLeft size={16} /> Back
        </button>

        {canEdit && !editing && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Entry options"
              className="text-[var(--ink-soft)] hover:text-[var(--ink)]"
            >
              <MoreVertical size={18} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 w-36 overflow-hidden rounded-xl bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
                <button
                  onClick={startEdit}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13.5px] text-[var(--ink)] hover:bg-[var(--line-soft)]"
                >
                  <Pencil size={13} /> Edit
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mx-auto max-w-[480px] px-6 pb-24">
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl">
          {(editing ? draftPhoto : displayEntry.photo) ? (
            <img
              src={editing ? draftPhoto : displayEntry.photo}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0" style={{ background: paletteColorForSeed(displayEntry.id) }} />
          )}
          {editing && (
            <label className="absolute bottom-3 right-3 flex cursor-pointer items-center gap-1.5 rounded-full bg-black/60 px-3.5 py-2 text-[12.5px] text-white backdrop-blur">
              <Camera size={14} />
              Change photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onPhotoFile(e.target.files[0])}
              />
            </label>
          )}
        </div>

        <div className="flex items-center gap-3 pt-4">
          <Avatar name={displayEntry.name} color={displayEntry.color} size={38} />
          <div>
            <p className="text-[14.5px] font-medium text-[var(--ink)]">{displayEntry.name}</p>
            <p className="text-[12px] text-[var(--ink-soft)]">{fullDate(displayEntry.date)}</p>
          </div>
        </div>

        {editing ? (
          <div className="mt-6 flex flex-col gap-3">
            <input
              value={draftSummary}
              onChange={(e) => setDraftSummary(e.target.value)}
              placeholder="One sentence about that day..."
              className="w-full rounded-xl border border-[var(--line)] p-3.5 text-[15px] outline-none focus:border-[var(--accent)]"
              style={{ fontFamily: 'var(--font-serif)', fontWeight: 300 }}
            />
            <textarea
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              rows={8}
              className="w-full resize-none rounded-xl border border-[var(--line)] p-3.5 text-[15px] leading-relaxed outline-none focus:border-[var(--accent)]"
              style={{ fontFamily: 'var(--font-serif)', fontWeight: 300 }}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(false)} className="rounded-full px-4 py-2 text-[13px] text-[var(--ink-soft)]">
                Cancel
              </button>
              <button onClick={save} className="rounded-full bg-[var(--ink)] px-5 py-2 text-[13px] text-white">
                Save
              </button>
            </div>
          </div>
        ) : (
          <p
            className="mt-6 whitespace-pre-line text-[18px] leading-relaxed text-[var(--ink)]"
            style={{ fontFamily: 'var(--font-serif)', fontWeight: 300 }}
          >
            {displayEntry.fullText ?? displayEntry.summary}
          </p>
        )}

        <CommentThread entryId={displayEntry.id} />
      </div>
    </div>
  )
}
