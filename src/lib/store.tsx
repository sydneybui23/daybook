import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  collection,
  query,
  where,
  collectionGroup,
  arrayUnion,
  type Unsubscribe,
} from 'firebase/firestore'
import type { Circle, CircleEntry, Comment, Entry, MemberRole, TemplateQuestion } from './types'
import { TEMPLATE_QUESTIONS } from './data'
import { detectHarm, runServerModeration, type FlagReason } from './moderation'
import { useAuth } from './auth'
import { db } from './firebase'

export type { Comment } from './types'

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

const DEFAULT_PROFILE: Profile = {
  name: '',
  bio: '',
  dailyReminder: true,
  shareByDefault: false,
  onboarded: false,
  insightsSubscribed: false,
  blockedFromSocial: false,
}

export interface ExplorePost extends Entry {
  ownerUid: string
}

interface StoreValue {
  ready: boolean
  entries: Entry[]
  addEntry: (e: Entry) => void
  updateEntry: (id: string, patch: Partial<Entry>) => void
  circles: Circle[]
  addCircle: (c: Omit<Circle, 'memberUids' | 'members' | 'entries'>) => void
  joinCircle: (circleId: string) => Promise<void>
  shareEntryToCircle: (circleId: string, entry: Entry) => void
  profile: Profile
  updateProfile: (patch: Partial<Profile>) => void
  readCircleEntryIds: Set<string>
  unreadCountForCircle: (circleId: string) => number
  totalUnreadCount: number
  markCircleRead: (circleId: string) => void
  commentsFor: (targetId: string) => Comment[]
  addComment: (targetId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => void
  updateCircle: (circleId: string, patch: Partial<Pick<Circle, 'name' | 'description' | 'cover'>>) => void
  removeMember: (circleId: string, memberId: string) => void
  updateMemberRole: (circleId: string, memberId: string, role: MemberRole) => void
  templateQuestions: TemplateQuestion[]
  updateTemplateQuestions: (questions: TemplateQuestion[]) => void
  reportComment: (targetId: string, commentId: string, reason: FlagReason) => void
  pendingModerationItems: () => { entryId: string; comment: Comment }[]
  resolveModeration: (targetId: string, commentId: string, decision: 'approved' | 'rejected') => void
  explorePublicPosts: ExplorePost[]
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const uid = user?.uid ?? null

  const [ready, setReady] = useState(false)
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE)
  const [templateQuestions, setTemplateQuestionsState] = useState<TemplateQuestion[]>(TEMPLATE_QUESTIONS)
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const [entries, setEntries] = useState<Entry[]>([])
  const [circleBases, setCircleBases] = useState<Omit<Circle, 'entries' | 'generalComments'>[]>([])
  const [circleEntries, setCircleEntries] = useState<Record<string, CircleEntry[]>>({})
  const [circleChats, setCircleChats] = useState<Record<string, Comment[]>>({})
  const [explorePublicPosts, setExplorePublicPosts] = useState<ExplorePost[]>([])

  // user profile doc (creates it on first real sign-in)
  useEffect(() => {
    if (!uid || !db) {
      setProfile(DEFAULT_PROFILE)
      setTemplateQuestionsState(TEMPLATE_QUESTIONS)
      setReadIds(new Set())
      setReady(!uid)
      return
    }
    const ref = doc(db, 'users', uid)
    return onSnapshot(ref, async (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        setProfile({ ...DEFAULT_PROFILE, ...data } as Profile)
        setTemplateQuestionsState((data.templateQuestions as TemplateQuestion[]) ?? TEMPLATE_QUESTIONS)
        setReadIds(new Set((data.readCircleEntryIds as string[]) ?? []))
      } else {
        await setDoc(ref, { ...DEFAULT_PROFILE, templateQuestions: TEMPLATE_QUESTIONS, readCircleEntryIds: [] })
      }
      setReady(true)
    })
  }, [uid])

  // personal entries
  useEffect(() => {
    if (!uid || !db) {
      setEntries([])
      return
    }
    const ref = collection(db, 'users', uid, 'entries')
    return onSnapshot(ref, (snap) => {
      const next = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Entry)
      next.sort((a, b) => (a.date < b.date ? 1 : -1))
      setEntries(next)
    })
  }, [uid])

  // circles you belong to (base metadata only — entries/chat load per-circle below)
  useEffect(() => {
    if (!uid || !db) {
      setCircleBases([])
      return
    }
    const q = query(collection(db, 'circles'), where('memberUids', 'array-contains', uid))
    return onSnapshot(q, (snap) => {
      setCircleBases(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Omit<Circle, 'entries' | 'generalComments'>))
    })
  }, [uid])

  // per-circle entries + general chat, kept in sync as circleBases changes
  const circleUnsubs = useRef<Record<string, Unsubscribe[]>>({})
  useEffect(() => {
    if (!db) return
    const currentIds = new Set(circleBases.map((c) => c.id))

    for (const id of Object.keys(circleUnsubs.current)) {
      if (!currentIds.has(id)) {
        circleUnsubs.current[id].forEach((fn) => fn())
        delete circleUnsubs.current[id]
        setCircleEntries((prev) => {
          const { [id]: _drop, ...rest } = prev
          return rest
        })
        setCircleChats((prev) => {
          const { [id]: _drop, ...rest } = prev
          return rest
        })
      }
    }

    for (const id of currentIds) {
      if (circleUnsubs.current[id]) continue
      const unsubEntries = onSnapshot(collection(db, 'circles', id, 'entries'), (snap) => {
        const next = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CircleEntry)
        next.sort((a, b) => (a.date < b.date ? 1 : -1))
        setCircleEntries((prev) => ({ ...prev, [id]: next }))
      })
      const unsubChat = onSnapshot(doc(db, 'circles', id, 'meta', 'chat'), (snap) => {
        setCircleChats((prev) => ({ ...prev, [id]: (snap.data()?.messages as Comment[]) ?? [] }))
      })
      circleUnsubs.current[id] = [unsubEntries, unsubChat]
    }

    return () => {
      if (currentIds.size === 0) {
        Object.values(circleUnsubs.current).forEach((fns) => fns.forEach((fn) => fn()))
        circleUnsubs.current = {}
      }
    }
  }, [circleBases])

  const circles: Circle[] = useMemo(
    () =>
      circleBases.map((c) => ({
        ...c,
        entries: circleEntries[c.id] ?? [],
        generalComments: circleChats[c.id] ?? [],
      })),
    [circleBases, circleEntries, circleChats],
  )

  // public posts across every account, for the Explore tab
  useEffect(() => {
    if (!uid || !db) {
      setExplorePublicPosts([])
      return
    }
    const q = query(collectionGroup(db, 'entries'), where('public', '==', true))
    return onSnapshot(
      q,
      (snap) => {
        const next = snap.docs.map((d) => {
          const ownerUid = d.ref.parent.parent?.id ?? ''
          return { id: d.id, ownerUid, ...d.data() } as ExplorePost
        })
        next.sort((a, b) => (a.date < b.date ? 1 : -1))
        setExplorePublicPosts(next)
      },
      () => setExplorePublicPosts([]),
    )
  }, [uid])

  const addEntry = (e: Entry) => {
    if (!uid || !db) return
    const database = db
    const sameDate = entries.filter((p) => p.date === e.date && p.id !== e.id)
    sameDate.forEach((p) => deleteDoc(doc(database, 'users', uid, 'entries', p.id)))
    setDoc(doc(database, 'users', uid, 'entries', e.id), {
      ...e,
      authorUid: uid,
      authorName: profile.name,
      authorColor: 'persianRed',
      authorPhoto: profile.photo ?? null,
    })
  }

  const updateEntry = (id: string, patch: Partial<Entry>) => {
    if (!uid || !db) return
    updateDoc(doc(db, 'users', uid, 'entries', id), patch)
  }

  const addCircle = (c: Omit<Circle, 'memberUids' | 'members' | 'entries'>) => {
    if (!uid || !db) return
    setDoc(doc(db, 'circles', c.id), {
      name: c.name,
      description: c.description,
      cover: c.cover,
      memberUids: [uid],
      members: [],
    })
  }

  const joinCircle = async (circleId: string) => {
    if (!uid || !db) return
    await updateDoc(doc(db, 'circles', circleId), {
      memberUids: arrayUnion(uid),
      members: arrayUnion({ id: uid, name: profile.name, color: 'persianRed', photo: profile.photo ?? null }),
    })
  }

  const shareEntryToCircle = (circleId: string, entry: Entry) => {
    if (!uid || !db) return
    const id = `ce-${Date.now()}`
    setDoc(doc(db, 'circles', circleId, 'entries', id), {
      memberId: uid,
      date: entry.date,
      summary: entry.summary,
      iconId: entry.iconId,
      photo: entry.photo ?? null,
      fullText: entry.freeText ?? null,
    })
  }

  const updateProfile = (patch: Partial<Profile>) => {
    if (!uid || !db) return
    updateDoc(doc(db, 'users', uid), patch)
  }

  const unreadCountForCircle = (circleId: string) => {
    const circle = circles.find((c) => c.id === circleId)
    if (!circle) return 0
    return circle.entries.filter((e) => e.memberId !== uid && !readIds.has(e.id)).length
  }

  const totalUnreadCount = circles.reduce(
    (sum, c) => sum + c.entries.filter((e) => e.memberId !== uid && !readIds.has(e.id)).length,
    0,
  )

  const markCircleRead = (circleId: string) => {
    if (!uid || !db) return
    const circle = circles.find((c) => c.id === circleId)
    if (!circle) return
    const newIds = circle.entries.map((e) => e.id).filter((id) => !readIds.has(id))
    if (newIds.length === 0) return
    updateDoc(doc(db, 'users', uid), { readCircleEntryIds: arrayUnion(...newIds) })
  }

  // targetId is a personal entry id, a circle-entry id, or a circle id (general chat bucket)
  const locate = (targetId: string): { kind: 'personal'; entry: Entry } | { kind: 'circleEntry'; circleId: string; entry: CircleEntry } | { kind: 'chat'; circleId: string } | null => {
    const personal = entries.find((e) => e.id === targetId)
    if (personal) return { kind: 'personal', entry: personal }
    for (const c of circles) {
      if (c.id === targetId) return { kind: 'chat', circleId: c.id }
      const ce = c.entries.find((e) => e.id === targetId)
      if (ce) return { kind: 'circleEntry', circleId: c.id, entry: ce }
    }
    return null
  }

  const commentsFor = (targetId: string): Comment[] => {
    const loc = locate(targetId)
    if (!loc) return []
    if (loc.kind === 'personal') return loc.entry.comments ?? []
    if (loc.kind === 'circleEntry') return loc.entry.comments ?? []
    return circleChats[loc.circleId] ?? []
  }

  const writeComments = (targetId: string, next: Comment[]) => {
    if (!uid || !db) return
    const loc = locate(targetId)
    if (!loc) return
    if (loc.kind === 'personal') {
      updateDoc(doc(db, 'users', uid, 'entries', targetId), { comments: next })
    } else if (loc.kind === 'circleEntry') {
      updateDoc(doc(db, 'circles', loc.circleId, 'entries', targetId), { comments: next })
    } else {
      setDoc(doc(db, 'circles', loc.circleId, 'meta', 'chat'), { messages: next })
    }
  }

  const addComment = (targetId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => {
    const id = `cm-${Date.now()}`
    const localFlag = comment.sticker ? null : detectHarm(comment.text)
    const withFlag: Comment = {
      ...comment,
      id,
      createdAt: Date.now(),
      ...(localFlag ? { flagged: true, flagReason: localFlag, flagSource: 'ai', moderationStatus: 'pending' } : {}),
    }
    writeComments(targetId, [...commentsFor(targetId), withFlag])

    if (!localFlag && !comment.sticker) {
      runServerModeration(comment.text).then((reason) => {
        if (reason) {
          const current = commentsFor(targetId).map((c) =>
            c.id === id ? { ...c, flagged: true, flagReason: reason, flagSource: 'ai' as const, moderationStatus: 'pending' as const } : c,
          )
          writeComments(targetId, current)
        }
      })
    }
  }

  const patchCommentEverywhere = (commentId: string, patch: Partial<Comment>): { targetId: string; comment: Comment } | null => {
    for (const e of entries) {
      if (e.comments?.some((c) => c.id === commentId)) {
        const next = e.comments.map((c) => (c.id === commentId ? { ...c, ...patch } : c))
        writeComments(e.id, next)
        return { targetId: e.id, comment: next.find((c) => c.id === commentId)! }
      }
    }
    for (const c of circles) {
      const ce = c.entries.find((e) => e.comments?.some((cm) => cm.id === commentId))
      if (ce) {
        const next = (ce.comments ?? []).map((cm) => (cm.id === commentId ? { ...cm, ...patch } : cm))
        writeComments(ce.id, next)
        return { targetId: ce.id, comment: next.find((cm) => cm.id === commentId)! }
      }
      const chat = circleChats[c.id] ?? []
      if (chat.some((m) => m.id === commentId)) {
        const next = chat.map((m) => (m.id === commentId ? { ...m, ...patch } : m))
        writeComments(c.id, next)
        return { targetId: c.id, comment: next.find((m) => m.id === commentId)! }
      }
    }
    return null
  }

  const reportComment = (_targetId: string, commentId: string, reason: FlagReason) => {
    patchCommentEverywhere(commentId, { flagged: true, flagReason: reason, flagSource: 'community', moderationStatus: 'pending' })
  }

  const pendingModerationItems = () => {
    const items: { entryId: string; comment: Comment }[] = []
    for (const e of entries) (e.comments ?? []).forEach((c) => c.moderationStatus === 'pending' && items.push({ entryId: e.id, comment: c }))
    for (const c of circles) {
      c.entries.forEach((e) => (e.comments ?? []).forEach((cm) => cm.moderationStatus === 'pending' && items.push({ entryId: e.id, comment: cm })))
      ;(circleChats[c.id] ?? []).forEach((m) => m.moderationStatus === 'pending' && items.push({ entryId: c.id, comment: m }))
    }
    return items.sort((a, b) => b.comment.createdAt - a.comment.createdAt)
  }

  const resolveModeration = (_targetId: string, commentId: string, decision: 'approved' | 'rejected') => {
    const result = patchCommentEverywhere(commentId, { moderationStatus: decision })
    if (decision === 'approved' && result && result.comment.author === profile.name) {
      updateProfile({ blockedFromSocial: true, blockedReason: result.comment.flagReason, blockedAt: Date.now() })
    }
  }

  const updateCircle = (circleId: string, patch: Partial<Pick<Circle, 'name' | 'description' | 'cover'>>) => {
    if (!db) return
    updateDoc(doc(db, 'circles', circleId), patch)
  }

  const removeMember = (circleId: string, memberId: string) => {
    if (!db) return
    const circle = circles.find((c) => c.id === circleId)
    if (!circle) return
    updateDoc(doc(db, 'circles', circleId), {
      members: circle.members.filter((m) => m.id !== memberId),
      memberUids: circle.memberUids.filter((id) => id !== memberId),
    })
  }

  const updateMemberRole = (circleId: string, memberId: string, role: MemberRole) => {
    if (!db) return
    const circle = circles.find((c) => c.id === circleId)
    if (!circle) return
    updateDoc(doc(db, 'circles', circleId), {
      members: circle.members.map((m) => (m.id === memberId ? { ...m, role } : m)),
    })
  }

  const updateTemplateQuestions = (questions: TemplateQuestion[]) => {
    setTemplateQuestionsState(questions)
    if (!uid || !db) return
    updateDoc(doc(db, 'users', uid), { templateQuestions: questions })
  }

  const value = useMemo(
    () => ({
      ready,
      entries,
      addEntry,
      updateEntry,
      circles,
      addCircle,
      joinCircle,
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
      reportComment,
      pendingModerationItems,
      resolveModeration,
      explorePublicPosts,
    }),
    [ready, entries, circles, profile, readIds, templateQuestions, explorePublicPosts, uid],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
