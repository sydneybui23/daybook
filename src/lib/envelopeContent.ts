import { DAILY_QUOTES, LOOKBACK_OFFSETS } from './data'
import type { Entry } from './types'

export interface EnvelopeContent {
  kind: 'quote' | 'lookback'
  text: string
  offset?: number
}

function dayHash(dateStr: string) {
  let h = 0
  for (let i = 0; i < dateStr.length; i++) h = (h * 31 + dateStr.charCodeAt(i)) >>> 0
  return h
}

// Deterministic per calendar day: same message all day, a new one tomorrow.
export function getTodayEnvelope(entries: Entry[]): EnvelopeContent {
  const today = new Date().toISOString().slice(0, 10)
  const hash = dayHash(today)
  const byDate = new Map(entries.map((e) => [e.date, e]))

  const wantsLookback = hash % 2 === 0
  if (wantsLookback) {
    const candidates = LOOKBACK_OFFSETS.filter((offset) => {
      const d = new Date()
      d.setDate(d.getDate() - offset)
      return byDate.has(d.toISOString().slice(0, 10))
    })
    if (candidates.length > 0) {
      const offset = candidates[hash % candidates.length]
      return { kind: 'lookback', text: `Look back ${offset} days, to who you were then.`, offset }
    }
  }

  const text = DAILY_QUOTES[hash % DAILY_QUOTES.length]
  return { kind: 'quote', text }
}
