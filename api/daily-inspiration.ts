export const config = { runtime: 'edge' }

type ContentType = 'scripture' | 'article' | 'music' | 'media'

interface ContentItem {
  title: string
  detail?: string
  url?: string
}

const TYPES: ContentType[] = ['scripture', 'article', 'music', 'media']

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

async function queryNotion(token: string, databaseId: string, date: string) {
  const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filter: { property: 'Date', date: { equals: date } },
    }),
  })
  if (!res.ok) throw new Error(`Notion query failed: ${res.status}`)
  const data = await res.json()
  return (data.results ?? []) as any[]
}

function rowToContent(row: any): { type: ContentType | null; item: ContentItem } {
  const props = row.properties ?? {}
  const type = (props.Type?.select?.name ?? '').toLowerCase() as ContentType
  const title =
    props.Title?.title?.[0]?.plain_text ?? props.Name?.title?.[0]?.plain_text ?? ''
  const detail = props.Detail?.rich_text?.[0]?.plain_text ?? ''
  const url = props.URL?.url ?? props.Link?.url ?? ''
  return {
    type: TYPES.includes(type) ? type : null,
    item: { title, detail: detail || undefined, url: url || undefined },
  }
}

async function fillMissingWithClaude(missing: ContentType[], apiKey: string) {
  const prompt = `For each of these content categories: ${missing.join(', ')}, find one short, freely accessible piece of content with NO paywall and NO login required, suitable for a daily journaling/reflection app:
- scripture: a short Bible verse and its reference
- article: a short reflective article, with a real working URL
- music: a song title and artist (a URL to a free-to-view page like a lyrics site or YouTube is a bonus, not required)
- media: a short video or audio piece, with a real working URL

Respond with ONLY strict JSON, no prose, no markdown fences, in this exact shape:
{"<type>": {"title": "...", "detail": "...", "url": "..."}, ...}
Only include the categories listed above. Only use sources you are confident are free to access.`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 1024,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) throw new Error(`Anthropic request failed: ${res.status}`)
  const data = await res.json()
  const textBlocks = (data.content ?? []).filter((b: any) => b.type === 'text')
  const lastText = textBlocks[textBlocks.length - 1]?.text ?? ''
  const match = lastText.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON found in model response')
  return JSON.parse(match[0]) as Record<string, ContentItem>
}

export default async function handler(): Promise<Response> {
  const NOTION_TOKEN = process.env.NOTION_TOKEN
  const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

  if (!NOTION_TOKEN || !NOTION_DATABASE_ID) {
    return new Response(JSON.stringify({ source: 'unconfigured' }), {
      headers: { 'content-type': 'application/json' },
    })
  }

  const date = todayStr()
  const content: Partial<Record<ContentType, ContentItem>> = {}

  try {
    const rows = await queryNotion(NOTION_TOKEN, NOTION_DATABASE_ID, date)
    for (const row of rows) {
      const { type, item } = rowToContent(row)
      if (type) content[type] = item
    }
  } catch (err) {
    return new Response(JSON.stringify({ source: 'error', message: String(err) }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }

  const missing = TYPES.filter((t) => !content[t])

  if (missing.length > 0 && ANTHROPIC_API_KEY) {
    try {
      const filled = await fillMissingWithClaude(missing, ANTHROPIC_API_KEY)
      for (const t of missing) {
        if (filled[t]) content[t] = filled[t]
      }
    } catch {
      // leave those categories empty; the frontend falls back to static defaults for them
    }
  }

  return new Response(JSON.stringify({ source: 'notion', date, content }), {
    headers: { 'content-type': 'application/json' },
  })
}
