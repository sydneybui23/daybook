import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Circle, CircleEntry, Entry, MemberRole, TemplateQuestion } from './types'
import { buildYearEntries, CIRCLES, TEMPLATE_QUESTIONS } from './data'
import { paletteIdAt } from './palette'
import { detectHarm, runServerModeration, type FlagReason } from './moderation'

const ENTRIES_KEY = 'daybook.entries.v2'
const PROFILE_KEY = 'daybook.profile.v1'
const READ_KEY = 'daybook.readCircleEntries.v1'
const COMMENTS_KEY = 'daybook.comments.v1'
const QUESTIONS_KEY = 'daybook.templateQuestions.v1'

export interface Profile {
  name: string
  bio: string
  photo?: string
  dailyReminder: boolean
  shareByDefault: boolean
  onboarded: boolean
  insightsSubscribed: boolean
  blockedFromSocial?: boolean
  blockedReason?: FlagReason
  blockedAt?: number
}

export interface Comment {
  id: string
  author: string
  authorColor: string
  text: string
  sticker: boolean
  createdAt: number
  flagged?: boolean
  flagReason?: FlagReason
  flagSource?: 'ai' | 'community'
  moderationStatus?: 'pending' | 'approved' | 'rejected'
}

const DEFAULT_PROFILE: Profile = {
  name: '',
  bio: '',
  dailyReminder: true,
  shareByDefault: false,
  onboarded: false,
  insightsSubscribed: false,
  blockedFromSocial: false,
}

function loadEntries(): Entry[] {
  try {
    const raw = localStorage.getItem(ENTRIES_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore corrupt storage
  }
  const seeded = buildYearEntries()
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(seeded))
  return seeded
}

function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (raw) return { ...DEFAULT_PROFILE, ...JSON.parse(raw) }
  } catch {
    // ignore corrupt storage
  }
  return DEFAULT_PROFILE
}

function loadReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_KEY)
    if (raw) return new Set(JSON.parse(raw))
  } catch {
    // ignore corrupt storage
  }
  return new Set()
}

function loadComments(): Record<string, Comment[]> {
  try {
    const raw = localStorage.getItem(COMMENTS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore corrupt storage
  }
  return {}
}

function loadTemplateQuestions(): TemplateQuestion[] {
  try {
    const raw = localStorage.getItem(QUESTIONS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore corrupt storage
  }
  return TEMPLATE_QUESTIONS
}

interface StoreValue {
  entries: Entry[]
  addEntry: (e: Entry) => void
  circles: Circle[]
  addCircle: (c: Circle) => void
  inviteMember: (circleId: string, name: string) => void
  shareEntryToCircle: (circleId: string, entry: Entry) => void
  profile: Profile
  updateProfile: (patch: Partial<Profile>) => void
  readCircleEntryIds: Set<string>
  unreadCountForCircle: (circleId: string) => number
  totalUnreadCount: number
  markCircleRead: (circleId: string) => void
  commentsFor: (entryId: string) => Comment[]
  addComment: (entryId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => void
  updateCircle: (circleId: string, patch: Partial<Pick<Circle, 'name' | 'description' | 'cover'>>) => void
  removeMember: (circleId: string, memberId: string) => void
  updateMemberRole: (circleId: string, memberId: string, role: MemberRole) => void
  templateQuestions: TemplateQuestion[]
  updateTemplateQuestions: (questions: TemplateQuestion[]) => void
  updateEntry: (id: string, patch: Partial<Entry>) => void
  reportComment: (entryId: string, commentId: string, reason: FlagReason) => void
  pendingModerationItems: () => { entryId: string; comment: Comment }[]
  resolveModeration: (entryId: string, commentId: string, decision: 'approved' | 'rejected') => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>(() => loadEntries())
  const [circles, setCircles] = useState<Circle[]>(CIRCLES)
  const [profile, setProfile] = useState<Profile>(() => loadProfile())
  const [readIds, setReadIds] = useState<Set<string>>(() => loadReadIds())
  const [comments, setComments] = useState<Record<string, Comment[]>>(() => loadComments())
  const [templateQuestions, setTemplateQuestions] = useState<TemplateQuestion[]>(() => loadTemplateQuestions())

  const addEntry = (e: Entry) => {
    setEntries((prev) => {
      const next = [e, ...prev.filter((p) => p.date !== e.date)]
      localStorage.setItem(ENTRIES_KEY, JSON.stringify(next))
      return next
    })
  }

  const updateEntry = (id: string, patch: Partial<Entry>) => {
    setEntries((prev) => {
      const next = prev.map((e) => (e.id === id ? { ...e, ...patch } : e))
      localStorage.setItem(ENTRIES_KEY, JSON.stringify(next))
      return next
    })
  }

  const addCircle = (c: Circle) => setCircles((prev) => [c, ...prev])

  const inviteMember = (circleId: string, name: string) => {
    setCircles((prev) =>
      prev.map((c) =>
        c.id === circleId
          ? {
              ...c,
              members: [
                ...c.members,
                {
                  id: `m-${Date.now()}`,
                  name,
                  color: paletteIdAt(c.members.length),
                  journalHint: 'Just invited, no journal history to summarize yet.',
                },
              ],
            }
          : c,
      ),
    )
  }

  const shareEntryToCircle = (circleId: string, entry: Entry) => {
    const newEntry: CircleEntry = {
      id: `ce-me-${Date.now()}`,
      memberId: 'me',
      date: entry.date,
      summary: entry.summary,
      iconId: entry.iconId,
      photo: entry.photo,
      fullText: entry.freeText,
    }
    setCircles((prev) => prev.map((c) => (c.id === circleId ? { ...c, entries: [newEntry, ...c.entries] } : c)))
    // it's your own entry, no need to notify yourself
    setReadIds((prev) => {
      const next = new Set(prev)
      next.add(newEntry.id)
      localStorage.setItem(READ_KEY, JSON.stringify(Array.from(next)))
      return next
    })
  }

  const updateProfile = (patch: Partial<Profile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch }
      localStorage.setItem(PROFILE_KEY, JSON.stringify(next))
      return next
    })
  }

  const unreadCountForCircle = (circleId: string) => {
    const circle = circles.find((c) => c.id === circleId)
    if (!circle) return 0
    return circle.entries.filter((e) => !readIds.has(e.id)).length
  }

  const totalUnreadCount = circles.reduce((sum, c) => sum + c.entries.filter((e) => !readIds.has(e.id)).length, 0)

  const markCircleRead = (circleId: string) => {
    const circle = circles.find((c) => c.id === circleId)
    if (!circle) return
    setReadIds((prev) => {
      const next = new Set(prev)
      circle.entries.forEach((e) => next.add(e.id))
      localStorage.setItem(READ_KEY, JSON.stringify(Array.from(next)))
      return next
    })
  }

  const commentsFor = (entryId: string) => comments[entryId] ?? []

  const patchComment = (entryId: string, commentId: string, patch: Partial<Comment>) => {
    setComments((prev) => {
      const next = {
        ...prev,
        [entryId]: (prev[entryId] ?? []).map((c) => (c.id === commentId ? { ...c, ...patch } : c)),
      }
      localStorage.setItem(COMMENTS_KEY, JSON.stringify(next))
      return next
    })
  }

  const addComment = (entryId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => {
    const id = `cm-${Date.now()}`
    const localFlag = comment.sticker ? null : detectHarm(comment.text)
    const withFlag: Comment = {
      ...comment,
      id,
      createdAt: Date.now(),
      ...(localFlag ? { flagged: true, flagReason: localFlag, flagSource: 'ai', moderationStatus: 'pending' } : {}),
    }
    setComments((prev) => {
      const next = { ...prev, [entryId]: [...(prev[entryId] ?? []), withFlag] }
      localStorage.setItem(COMMENTS_KEY, JSON.stringify(next))
      return next
    })

    if (!localFlag && !comment.sticker) {
      runServerModeration(comment.text).then((reason) => {
        if (reason) patchComment(entryId, id, { flagged: true, flagReason: reason, flagSource: 'ai', moderationStatus: 'pending' })
      })
    }
  }

  const reportComment = (entryId: string, commentId: string, reason: FlagReason) => {
    patchComment(entryId, commentId, { flagged: true, flagReason: reason, flagSource: 'community', moderationStatus: 'pending' })
  }

  const pendingModerationItems = () => {
    const items: { entryId: string; comment: Comment }[] = []
    for (const [entryId, list] of Object.entries(comments)) {
      for (const comment of list) {
        if (comment.moderationStatus === 'pending') items.push({ entryId, comment })
      }
    }
    return items.sort((a, b) => b.comment.createdAt - a.comment.createdAt)
  }

  const resolveModeration = (entryId: string, commentId: string, decision: 'approved' | 'rejected') => {
    const comment = (comments[entryId] ?? []).find((c) => c.id === commentId)
    patchComment(entryId, commentId, { moderationStatus: decision })
    if (decision === 'approved' && comment && comment.author === profile.name) {
      updateProfile({ blockedFromSocial: true, blockedReason: comment.flagReason, blockedAt: Date.now() })
    }
  }

  const updateCircle = (circleId: string, patch: Partial<Pick<Circle, 'name' | 'description' | 'cover'>>) => {
    setCircles((prev) => prev.map((c) => (c.id === circleId ? { ...c, ...patch } : c)))
  }

  const removeMember = (circleId: string, memberId: string) => {
    setCircles((prev) =>
      prev.map((c) => (c.id === circleId ? { ...c, members: c.members.filter((m) => m.id !== memberId) } : c)),
    )
  }

  const updateMemberRole = (circleId: string, memberId: string, role: MemberRole) => {
    setCircles((prev) =>
      prev.map((c) =>
        c.id === circleId
          ? { ...c, members: c.members.map((m) => (m.id === memberId ? { ...m, role } : m)) }
          : c,
      ),
    )
  }

  const updateTemplateQuestions = (questions: TemplateQuestion[]) => {
    setTemplateQuestions(questions)
    localStorage.setItem(QUESTIONS_KEY, JSON.stringify(questions))
  }

  const value = useMemo(
    () => ({
      entries,
      addEntry,
      circles,
      addCircle,
      inviteMember,
      shareEntryToCircle,
      profile,
      updateProfile,
      readCircleEntryIds: readIds,
      unreadCountForCircle,
      totalUnreadCount,
      markCircleRead,
      commentsFor,
      addComment,
      updateCircle,
      removeMember,
      updateMemberRole,
      templateQuestions,
      updateTemplateQuestions,
      updateEntry,
      reportComment,
      pendingModerationItems,
      resolveModeration,
    }),
    [entries, circles, profile, readIds, comments, templateQuestions],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
