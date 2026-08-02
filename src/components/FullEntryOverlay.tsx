import { useRef, useState } from 'react'
import { deleteField } from 'firebase/firestore'
import { ArrowLeft, Camera, ChevronLeft, ChevronRight, MoreVertical, Pencil, Trash2, Share2, X, Plus } from 'lucide-react'
import { useStore } from '../lib/store'
import { paletteColorForSeed } from '../lib/palette'
import { fileToCompressedDataUrl } from '../lib/imageUtils'
import { Avatar } from '../lib/avatars'
import { CommentThread } from './CommentThread'
import { RichTextToolbar } from './RichTextToolbar'
import { RichText, stripMarkdown } from '../lib/richText'
import type { PostEntry } from './PostCard'

const MAX_PHOTOS = 6

function fullDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
}

function PhotoCarousel({ photos }: { photos: string[] }) {
  const [index, setIndex] = useState(0)
  const clamped = Math.min(index, photos.length - 1)

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl">
      <img src={photos[clamped]} alt="" className="absolute inset-0 h-full w-full object-cover" />
      {photos.length > 1 && (
        <>
          {clamped > 0 && (
            <button
              onClick={() => setIndex(clamped - 1)}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/65"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          {clamped < photos.length - 1 && (
            <button
              onClick={() => setIndex(clamped + 1)}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/65"
            >
              <ChevronRight size={18} />
            </button>
          )}
          <span className="absolute right-3 top-3 rounded-full bg-black/55 px-2 py-0.5 text-[11px] text-white backdrop-blur-sm">
            {clamped + 1} / {photos.length}
          </span>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Photo ${i + 1}`}
                className="h-1.5 w-1.5 rounded-full transition-colors"
                style={{ background: i === clamped ? 'white' : 'rgba(255,255,255,0.45)' }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
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
  const { profile, entries, updateEntry, deleteEntry } = useStore()
  const [displayEntry, setDisplayEntry] = useState(entry)
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [editing, setEditing] = useState(!!startInEdit)
  const [draftSummary, setDraftSummary] = useState(entry.summary)
  const [draftText, setDraftText] = useState(entry.fullText ?? entry.summary)
  const [draftPhotos, setDraftPhotos] = useState<string[]>(entry.photos ?? (entry.photo ? [entry.photo] : []))
  const draftTextRef = useRef<HTMLTextAreaElement>(null)

  const canEdit = displayEntry.name === profile.name && entries.some((e) => e.id === displayEntry.id)

  const startEdit = () => {
    setDraftSummary(displayEntry.summary)
    setDraftText(displayEntry.fullText ?? displayEntry.summary)
    setDraftPhotos(displayEntry.photos ?? (displayEntry.photo ? [displayEntry.photo] : []))
    setEditing(true)
    setMenuOpen(false)
  }

  const handleDelete = () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true)
      return
    }
    deleteEntry(displayEntry.id)
    setMenuOpen(false)
    onBack()
  }

  const shareOutside = async () => {
    setMenuOpen(false)
    const text = `${stripMarkdown(displayEntry.fullText ?? displayEntry.summary)}\n\n— written in daybook, ${fullDate(displayEntry.date)}`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'A daybook entry', text })
      } catch {
        // user cancelled the share sheet, ignore
      }
      return
    }
    try {
      await navigator.clipboard.writeText(text)
      alert('Copied to your clipboard.')
    } catch {
      // clipboard unavailable, nothing more we can do
    }
  }

  const onAddFiles = async (files: FileList) => {
    const remaining = MAX_PHOTOS - draftPhotos.length
    if (remaining <= 0) {
      alert(`You can add up to ${MAX_PHOTOS} photos per entry.`)
      return
    }
    for (const file of Array.from(files).slice(0, remaining)) {
      try {
        const url = await fileToCompressedDataUrl(file, 800, 0.6)
        setDraftPhotos((prev) => [...prev, url])
      } catch {
        alert("Couldn't read that photo — try a JPEG, PNG, or screenshot.")
      }
    }
  }

  const onRemovePhoto = (index: number) => {
    setDraftPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const save = () => {
    // a manual full-text edit turns a guided-template entry into free-form text —
    // otherwise the old per-question answers would keep overriding it on every render
    updateEntry(displayEntry.id, {
      summary: draftSummary.trim() || displayEntry.summary,
      freeText: draftText.trim(),
      mode: 'free',
      answers: deleteField(),
      photo: draftPhotos[0] ?? deleteField(),
      photos: draftPhotos.length > 0 ? draftPhotos : deleteField(),
    })
    setDisplayEntry((prev) => ({
      ...prev,
      summary: draftSummary.trim() || prev.summary,
      fullText: draftText.trim(),
      photo: draftPhotos[0],
      photos: draftPhotos.length > 0 ? draftPhotos : undefined,
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
              onClick={() => {
                setMenuOpen((v) => !v)
                setConfirmingDelete(false)
              }}
              aria-label="Entry options"
              className="text-[var(--ink-soft)] hover:text-[var(--ink)]"
            >
              <MoreVertical size={18} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 w-44 overflow-hidden rounded-xl bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
                <button
                  onClick={startEdit}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13.5px] text-[var(--ink)] hover:bg-[var(--line-soft)]"
                >
                  <Pencil size={13} /> Edit
                </button>
                <button
                  onClick={shareOutside}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13.5px] text-[var(--ink)] hover:bg-[var(--line-soft)]"
                >
                  <Share2 size={13} /> Share
                </button>
                <button
                  onClick={handleDelete}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13.5px] hover:bg-[var(--line-soft)]"
                  style={{ color: confirmingDelete ? '#bb4e3f' : 'var(--ink)' }}
                >
                  <Trash2 size={13} /> {confirmingDelete ? 'Confirm delete?' : 'Delete'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mx-auto max-w-[480px] px-6 pb-24">
        {editing ? (
          <div className="flex flex-wrap gap-2.5">
            {draftPhotos.map((p, i) => (
              <div key={i} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                <img src={p} alt="" className="h-full w-full object-cover" />
                <button
                  onClick={() => onRemovePhoto(i)}
                  aria-label="Remove photo"
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {draftPhotos.length < MAX_PHOTOS && (
              <label className="flex h-20 w-20 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[var(--line)] text-[var(--ink-soft)] hover:border-[var(--accent)]">
                {draftPhotos.length === 0 ? <Camera size={20} /> : <Plus size={20} />}
                <span className="text-[10px]">{draftPhotos.length === 0 ? 'Add photo' : 'Add more'}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && onAddFiles(e.target.files)}
                />
              </label>
            )}
          </div>
        ) : (displayEntry.photos?.length ?? 0) > 0 ? (
          <PhotoCarousel photos={displayEntry.photos!} />
        ) : (
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl">
            {displayEntry.photo ? (
              <img src={displayEntry.photo} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0" style={{ background: paletteColorForSeed(displayEntry.id) }} />
            )}
          </div>
        )}

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
            <div>
              <RichTextToolbar textareaRef={draftTextRef} value={draftText} onChange={setDraftText} />
              <textarea
                ref={draftTextRef}
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                rows={8}
                className="w-full resize-none rounded-xl border border-[var(--line)] p-3.5 text-[15px] leading-relaxed outline-none focus:border-[var(--accent)]"
                style={{ fontFamily: 'var(--font-serif)', fontWeight: 300 }}
              />
            </div>
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
          <RichText
            text={displayEntry.fullText ?? displayEntry.summary}
            className="mt-6 text-[18px] leading-relaxed text-[var(--ink)]"
            style={{ fontFamily: 'var(--font-serif)', fontWeight: 300 }}
          />
        )}

        <CommentThread entryId={displayEntry.id} />
      </div>
    </div>
  )
}
