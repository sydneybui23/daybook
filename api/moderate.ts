export const config = { runtime: 'edge' }

export default async function handler(request: Request): Promise<Response> {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ flagged: false }), { headers: { 'content-type': 'application/json' } })
  }

  const { text } = (await request.json().catch(() => ({ text: '' }))) as { text?: string }
  if (!text || !text.trim()) {
    return new Response(JSON.stringify({ flagged: false }), { headers: { 'content-type': 'application/json' } })
  }

  const prompt = `Classify the following user-submitted comment from a journaling app's social/comment section. Respond with ONLY strict JSON, no prose:
{"flagged": true|false, "reason": "bullying"|"racism"|"hate"|null}

Flag it true only if it is genuinely bullying, racist, or hateful toward a person or group. Do not flag strong emotion, venting about one's own day, or disagreement that isn't targeted harassment.

Comment: ${JSON.stringify(text)}`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!res.ok) throw new Error(`Anthropic request failed: ${res.status}`)
    const data = await res.json()
    const textBlock = (data.content ?? []).find((b: any) => b.type === 'text')?.text ?? ''
    const match = textBlock.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON in model response')
    const parsed = JSON.parse(match[0])
    return new Response(JSON.stringify({ flagged: !!parsed.flagged, reason: parsed.reason ?? null }), {
      headers: { 'content-type': 'application/json' },
    })
  } catch {
    return new Response(JSON.stringify({ flagged: false }), { headers: { 'content-type': 'application/json' } })
  }
}
