import type { CSSProperties, ReactNode } from 'react'

// Minimal markdown-ish formatting: **bold**, *italic*, [label](url) links,
// "- " bullet lines, and blank-line-separated paragraphs. Deliberately not a
// full markdown parser — just the handful of things the entry toolbar writes.
const INLINE_PATTERN = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g

function renderInline(line: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let i = 0
  INLINE_PATTERN.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = INLINE_PATTERN.exec(line))) {
    if (match.index > lastIndex) nodes.push(line.slice(lastIndex, match.index))
    if (match[1] !== undefined) {
      nodes.push(
        <strong key={`${keyPrefix}-${i++}`} style={{ fontWeight: 700 }}>
          {match[1]}
        </strong>,
      )
    } else if (match[2] !== undefined) {
      nodes.push(<em key={`${keyPrefix}-${i++}`}>{match[2]}</em>)
    } else if (match[3] !== undefined) {
      nodes.push(
        <a
          key={`${keyPrefix}-${i++}`}
          href={match[4]}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="underline"
          style={{ color: 'var(--accent)' }}
        >
          {match[3]}
        </a>,
      )
    }
    lastIndex = INLINE_PATTERN.lastIndex
  }
  if (lastIndex < line.length) nodes.push(line.slice(lastIndex))
  return nodes
}

export function RichText({ text, className, style }: { text: string; className?: string; style?: CSSProperties }) {
  const blocks = text.split(/\n{2,}/)
  return (
    <div className={className} style={style}>
      {blocks.map((block, bi) => {
        const lines = block.split('\n').filter((l) => l.length > 0)
        if (lines.length === 0) return null
        const isBulletBlock = lines.every((l) => /^\s*[-•]\s/.test(l))
        if (isBulletBlock) {
          return (
            <ul key={bi} className={`list-disc pl-5 ${bi > 0 ? 'mt-3' : ''}`}>
              {lines.map((l, li) => (
                <li key={li}>{renderInline(l.replace(/^\s*[-•]\s/, ''), `${bi}-${li}`)}</li>
              ))}
            </ul>
          )
        }
        return (
          <p key={bi} className={bi > 0 ? 'mt-3' : ''}>
            {lines.map((l, li) => (
              <span key={li}>
                {renderInline(l, `${bi}-${li}`)}
                {li < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        )
      })}
    </div>
  )
}

// plain-text fallback for contexts that can't render JSX (native share sheets, clipboard)
export function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1 ($2)')
    .replace(/^\s*[-•]\s/gm, '')
}
