import type { Entry, TemplateQuestion } from './types'
import type { PostEntry } from '../components/PostCard'

export function entryBodyText(entry: Entry, questions: TemplateQuestion[]): string {
  if (entry.mode === 'free' || !entry.answers) return entry.freeText || entry.summary
  const parts = Object.entries(entry.answers)
    .filter(([, answer]) => answer.trim())
    .map(([qId, answer]) => {
      const label = questions.find((q) => q.id === qId)?.label ?? qId
      return `${label}\n${answer}`
    })
  return parts.length > 0 ? parts.join('\n\n') : entry.summary
}

export function toPostEntry(entry: Entry, authorName: string, authorColor: string, questions: TemplateQuestion[]): PostEntry {
  return {
    id: entry.id,
    name: authorName,
    color: authorColor,
    summary: entry.summary,
    iconId: entry.iconId,
    photo: entry.photo,
    photos: entry.photos,
    fullText: entryBodyText(entry, questions),
    date: entry.date,
  }
}
