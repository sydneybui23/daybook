export type FlagReason = 'bullying' | 'racism' | 'hate' | 'other'

// Lightweight, clearly-a-demo stand-in for a real moderation model. It exists so the
// report -> review -> block flow can be demonstrated without any backend configured.
// For real coverage, deploy api/moderate.ts (calls Claude) with ANTHROPIC_API_KEY set;
// runServerModeration below upgrades a comment in place if that catches something this misses.
const BULLYING_PATTERNS = [
  /kill (your\s?self|urself)/i,
  /\bkys\b/i,
  /you'?re (worthless|pathetic|disgusting|a loser)/i,
  /nobody (likes|wants) you/i,
  /you should (die|disappear)/i,
]

const RACISM_PATTERNS = [/go back to (your|where you)/i, /your (kind|people) don'?t belong/i, /sub-?human/i]

const HATE_PATTERNS = [/i hate all \w+/i, /\w+ people are (all\s+)?(disgusting|animals|vermin)/i]

export function detectHarm(text: string): FlagReason | null {
  if (BULLYING_PATTERNS.some((p) => p.test(text))) return 'bullying'
  if (RACISM_PATTERNS.some((p) => p.test(text))) return 'racism'
  if (HATE_PATTERNS.some((p) => p.test(text))) return 'hate'
  return null
}

export async function runServerModeration(text: string): Promise<FlagReason | null> {
  try {
    const res = await fetch('/api/moderate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.flagged ? (data.reason ?? 'other') : null
  } catch {
    return null
  }
}
