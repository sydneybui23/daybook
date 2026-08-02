import { useState, type RefObject } from 'react'
import { Bold, Italic, List, Pilcrow, Link as LinkIcon, X } from 'lucide-react'

export function RichTextToolbar({
  textareaRef,
  value,
  onChange,
}: {
  textareaRef: RefObject<HTMLTextAreaElement | null>
  value: string
  onChange: (next: string) => void
}) {
  const [addingLink, setAddingLink] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')

  const wrapSelection = (marker: string) => {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = value.slice(start, end)
    const next = value.slice(0, start) + marker + selected + marker + value.slice(end)
    onChange(next)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + marker.length, start + marker.length + selected.length)
    })
  }

  const toggleBullets = () => {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    let lineEnd = value.indexOf('\n', end)
    if (lineEnd === -1) lineEnd = value.length
    const block = value.slice(lineStart, lineEnd)
    const lines = block.split('\n')
    const allBulleted = lines.every((l) => l.trim() === '' || /^\s*-\s/.test(l))
    const nextLines = lines.map((l) => {
      if (l.trim() === '') return l
      return allBulleted ? l.replace(/^(\s*)-\s/, '$1') : `- ${l}`
    })
    const nextBlock = nextLines.join('\n')
    const next = value.slice(0, lineStart) + nextBlock + value.slice(lineEnd)
    onChange(next)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(lineStart, lineStart + nextBlock.length)
    })
  }

  const insertParagraphBreak = () => {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const next = value.slice(0, start) + '\n\n' + value.slice(end)
    onChange(next)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + 2, start + 2)
    })
  }

  const confirmLink = () => {
    const el = textareaRef.current
    const url = linkUrl.trim()
    if (!el || !url) {
      setAddingLink(false)
      return
    }
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = value.slice(start, end) || 'link'
    const href = /^https?:\/\//.test(url) ? url : `https://${url}`
    const inserted = `[${selected}](${href})`
    const next = value.slice(0, start) + inserted + value.slice(end)
    onChange(next)
    setAddingLink(false)
    setLinkUrl('')
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + inserted.length
      el.setSelectionRange(pos, pos)
    })
  }

  return (
    <div className="mb-1.5">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => wrapSelection('**')}
          aria-label="Bold"
          className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--ink-soft)] hover:bg-[var(--line-soft)] hover:text-[var(--ink)]"
        >
          <Bold size={14} />
        </button>
        <button
          type="button"
          onClick={() => wrapSelection('*')}
          aria-label="Italic"
          className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--ink-soft)] hover:bg-[var(--line-soft)] hover:text-[var(--ink)]"
        >
          <Italic size={14} />
        </button>
        <button
          type="button"
          onClick={toggleBullets}
          aria-label="Bullet list"
          className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--ink-soft)] hover:bg-[var(--line-soft)] hover:text-[var(--ink)]"
        >
          <List size={14} />
        </button>
        <button
          type="button"
          onClick={insertParagraphBreak}
          aria-label="New paragraph"
          className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--ink-soft)] hover:bg-[var(--line-soft)] hover:text-[var(--ink)]"
        >
          <Pilcrow size={14} />
        </button>
        <button
          type="button"
          onClick={() => setAddingLink((v) => !v)}
          aria-label="Add link"
          className={`flex h-7 w-7 items-center justify-center rounded-md hover:bg-[var(--line-soft)] ${
            addingLink ? 'text-[var(--accent)]' : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
          }`}
        >
          <LinkIcon size={14} />
        </button>
      </div>
      {addingLink && (
        <div className="mt-1.5 flex items-center gap-1.5">
          <input
            autoFocus
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                confirmLink()
              }
            }}
            placeholder="https://..."
            className="flex-1 rounded-lg border border-[var(--line)] px-2.5 py-1.5 text-[12.5px] outline-none focus:border-[var(--accent)]"
          />
          <button
            type="button"
            onClick={confirmLink}
            className="shrink-0 rounded-full bg-[var(--ink)] px-3 py-1.5 text-[12px] text-white"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setAddingLink(false)
              setLinkUrl('')
            }}
            aria-label="Cancel link"
            className="shrink-0 text-[var(--ink-soft)] hover:text-[var(--ink)]"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
