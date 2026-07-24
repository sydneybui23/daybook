import { useEffect, useState } from 'react'
import { INSPIRATION_TODAY } from './data'

interface ContentItem {
  title: string
  detail?: string
  url?: string
}

type ContentType = 'scripture' | 'article' | 'music' | 'media'

interface DailyInspirationResponse {
  source: 'notion' | 'unconfigured' | 'error'
  content?: Partial<Record<ContentType, ContentItem>>
}

export interface DailyInspiration {
  scripture: { reference: string; verse: string; url?: string }
  article: { title: string; source?: string; blurb?: string; url?: string }
  music: { title: string; artist?: string; url?: string }
  media: { title: string; kind?: string; url?: string }
  featuredEntry: (typeof INSPIRATION_TODAY)['featuredEntry']
  fromNotion: boolean
}

const FALLBACK: DailyInspiration = {
  scripture: INSPIRATION_TODAY.scripture,
  article: INSPIRATION_TODAY.article,
  music: INSPIRATION_TODAY.music,
  media: INSPIRATION_TODAY.media,
  featuredEntry: INSPIRATION_TODAY.featuredEntry,
  fromNotion: false,
}

export function useDailyInspiration(): DailyInspiration {
  const [inspiration, setInspiration] = useState<DailyInspiration>(FALLBACK)

  useEffect(() => {
    let cancelled = false
    fetch('/api/daily-inspiration')
      .then((res) => (res.ok ? (res.json() as Promise<DailyInspirationResponse>) : null))
      .then((data) => {
        if (cancelled || !data || data.source !== 'notion' || !data.content) return
        const c = data.content
        setInspiration({
          scripture: c.scripture
            ? { reference: c.scripture.detail ?? '', verse: c.scripture.title, url: c.scripture.url }
            : FALLBACK.scripture,
          article: c.article
            ? { title: c.article.title, source: c.article.detail, blurb: c.article.detail, url: c.article.url }
            : FALLBACK.article,
          music: c.music ? { title: c.music.title, artist: c.music.detail, url: c.music.url } : FALLBACK.music,
          media: c.media ? { title: c.media.title, kind: c.media.detail, url: c.media.url } : FALLBACK.media,
          featuredEntry: FALLBACK.featuredEntry,
          fromNotion: true,
        })
      })
      .catch(() => {
        // stay on the static fallback content (e.g. running locally without the Notion function)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return inspiration
}
