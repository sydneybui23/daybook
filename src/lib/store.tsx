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
  deleteField,
  type FieldValue,
  type Unsubscribe,
} from 'firebase/firestore'
import type { Circle, CircleEntry, Comment, Entry, HabitItem, MemberRole, TemplateQuestion, TravelEntry } from './types'
import { DEFAULT_HABITS, TEMPLATE_QUESTIONS } from './data'
import { detectHarm, runServerModeration, type FlagReason } from './moderation'
import { entryBodyText } from './entryHelpers'
import { useAuth } from './auth'
import { db } from './firebase'

type EntryPatch = { [K in keyof Entry]?: Entry[K] | FieldValue }
type TravelPatch = { [K in keyof TravelEntry]?: TravelEntry[K] | FieldValue }

// how long a soft-deleted entry stays recoverable in Recently Deleted before being purged for good
const TRASH_RETENTION_MS = 30 * 24 * 60 * 60 * 1000

function reportFailure(action: string) {
  return (err: unknown) => {
    console.error(err)
    const code = (err as { code?: string } | null)?.code
    const reason =
      code === 'permission-denied'
        ? "the app doesn't have permission to do that yet — this usually means the Firestore security rules haven't been updated in the Firebase Console"
        : code
          ? `something went wrong (${code})`
          : 'check your connection and try again'
    alert(`Couldn't ${action}. ${reason.charAt(0).toUpperCase()}${reason.slice(1)}.`)
  }
}

export type { Comment } from './types'

export interface Profile {
  name: string
  bio: string
  photo?: string
  dailyReminder: boolean
  reminderTime: string
  shareByDefault: boolean
  onboarded: boolean
  insightsSubscribed: boolean
  timezone: string
  blockedFromSocial?: boolean
  blockedReason?: FlagReason
  blockedAt?: number
}

function detectTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

const DEFAULT_PROFILE: Profile = {
  name: '',
  bio: '',
  dailyReminder: true,
  reminderTime: '20:00',
  shareByDefault: false,
  onboarded: false,
  insightsSubscribed: false,
  timezone: detectTimezone(),
  blockedFromSocial: false,
}

export interface ExplorePost extends Entry {
  ownerUid: string
}

interface StoreValue {
  ready: boolean
  entries: Entry[]
  deletedEntries: Entry[]
  addEntry: (e: Entry) => void
  updateEntry: (id: string, patch: EntryPatch) => void
  deleteEntry: (id: string) => void
  restoreEntry: (id: string) => void
  permanentlyDeleteEntry: (id: string) => void
  circles: Circle[]
  addCircle: (c: Omit<Circle, 'memberUids' | 'members' | 'entries'>) => void
  joinCircle: (circleId: string) => Promise<void>
  shareEntryToCircle: (circleId: string, entry: Entry) => void
  deleteCircleEntry: (circleId: string, entryId: string) => void
  deleteCircle: (circleId: string) => void
  profile: Profile
  updateProfile: (patch: Partial<Profile>) => void
  readCircleEntryIds: Set<string>
  unreadCountForCircle: (circleId: string) => number
  totalUnreadCount: number
  markCircleRead: (circleId: string) => void
  commentsFor: (targetId: string) => Comment[]
  addComment: (targetId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => void
  deleteComment: (targetId: string, commentId: string) => void
  updateCircle: (circleId: string, patch: Partial<Pick<Circle, 'name' | 'description' | 'cover'>>) => void
  removeMember: (circleId: string, memberId: string) => void
  updateMemberRole: (circleId: string, memberId: string, role: MemberRole) => void
  templateQuestions: TemplateQuestion[]
  updateTemplateQuestions: (questions: TemplateQuestion[]) => void
  reportComment: (targetId: string, commentId: string, reason: FlagReason) => void
  pendingModerationItems: () => { entryId: string; comment: Comment }[]
  resolveModeration: (targetId: string, commentId: string, decision: 'approved' | 'rejected') => void
  explorePublicPosts: ExplorePost[]
  followingUids: Set<string>
  followUser: (targetUid: string, targetName: string) => void
  unfollowUser: (targetUid: string) => void
  habits: HabitItem[]
  updateHabits: (habits: HabitItem[]) => void
  habitLogs: Record<string, string[]>
  toggleHabit: (date: string, habitId: string) => void
  likedEntryIds: Set<string>
  toggleLike: (entryId: string) => void
  travelEntries: TravelEntry[]
  addTravelEntry: (e: Omit<TravelEntry, 'id'>) => void
  updateTravelEntry: (id: string, patch: TravelPatch) => void
  deleteTravelEntry: (id: string) => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const uid = user?.uid ?? null

  const [ready, setReady] = useState(false)
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE)
  const [templateQuestions, setTemplateQuestionsState] = useState<TemplateQuestion[]>(TEMPLATE_QUESTIONS)
  const [habits, setHabitsState] = useState<HabitItem[]>(DEFAULT_HABITS)
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const [allEntries, setAllEntries] = useState<Entry[]>([])
  const entries = useMemo(() => allEntries.filter((e) => !e.deletedAt), [allEntries])
  const deletedEntries = useMemo(
    () => allEntries.filter((e) => e.deletedAt).sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0)),
    [allEntries],
  )
  const [circleBases, setCircleBases] = useState<Omit<Circle, 'entries' | 'generalComments'>[]>([])
  const [circleEntries, setCircleEntries] = useState<Record<string, CircleEntry[]>>({})
  const [circleChats, setCircleChats] = useState<Record<string, Comment[]>>({})
  const [explorePublicPosts, setExplorePublicPosts] = useState<ExplorePost[]>([])
  const [habitLogs, setHabitLogs] = useState<Record<string, string[]>>({})

  // user profile doc (creates it on first real sign-in)
  useEffect(() => {
    if (!uid || !db) {
      setProfile(DEFAULT_PROFILE)
      setTemplateQuestionsState(TEMPLATE_QUESTIONS)
      setHabitsState(DEFAULT_HABITS)
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
        setHabitsState((data.habits as HabitItem[]) ?? DEFAULT_HABITS)
        setReadIds(new Set((data.readCircleEntryIds as string[]) ?? []))
      } else {
        await setDoc(ref, { ...DEFAULT_PROFILE, templateQuestions: TEMPLATE_QUESTIONS, habits: DEFAULT_HABITS, readCircleEntryIds: [] })
      }
      setReady(true)
    })
  }, [uid])

  // daily habit completions, one doc per date: users/{uid}/habitLogs/{date}
  useEffect(() => {
    if (!uid || !db) {
      setHabitLogs({})
      return
    }
    const ref = collection(db, 'users', uid, 'habitLogs')
    return onSnapshot(ref, (snap) => {
      const next: Record<string, string[]> = {}
      snap.docs.forEach((d) => {
        next[d.id] = (d.data().completed as string[]) ?? []
      })
      setHabitLogs(next)
    })
  }, [uid])

  // travel history + planned trips: users/{uid}/travel/{id}
  const [travelEntries, setTravelEntries] = useState<TravelEntry[]>([])
  useEffect(() => {
    if (!uid || !db) {
      setTravelEntries([])
      return
    }
    const ref = collection(db, 'users', uid, 'travel')
    return onSnapshot(ref, (snap) => {
      const next = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TravelEntry)
      next.sort((a, b) => (a.year === b.year ? a.month - b.month : a.year - b.year))
      setTravelEntries(next)
    })
  }, [uid])

  // personal entries (includes soft-deleted ones, filtered into entries/deletedEntries above)
  useEffect(() => {
    if (!uid || !db) {
      setAllEntries([])
      return
    }
    const database = db
    const ref = collection(database, 'users', uid, 'entries')
    return onSnapshot(ref, (snap) => {
      const next = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Entry)
      next.sort((a, b) => (a.date < b.date ? 1 : -1))
      setAllEntries(next)

      // quietly purge anything that's sat in Recently Deleted past the retention window
      const cutoff = Date.now() - TRASH_RETENTION_MS
      for (const e of next) {
        if (e.deletedAt && e.deletedAt < cutoff) {
          deleteDoc(doc(database, 'users', uid, 'entries', e.id)).catch(() => {})
        }
      }
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
        const next = snap.docs
          .map((d) => {
            const ownerUid = d.ref.parent.parent?.id ?? ''
            return { id: d.id, ownerUid, ...d.data() } as ExplorePost
          })
          // soft-deleted entries stay in Firestore for Recently Deleted, but shouldn't surface publicly
          .filter((p) => !p.deletedAt)
        next.sort((a, b) => (a.date < b.date ? 1 : -1))
        setExplorePublicPosts(next)
      },
      () => setExplorePublicPosts([]),
    )
  }, [uid])

  // uids you follow, so Following / follow-buttons / follower counts can react live
  const [followingUids, setFollowingUids] = useState<Set<string>>(new Set())
  useEffect(() => {
    if (!uid || !db) {
      setFollowingUids(new Set())
      return
    }
    const q = query(collection(db, 'follows'), where('followerUid', '==', uid))
    return onSnapshot(
      q,
      (snap) => setFollowingUids(new Set(snap.docs.map((d) => d.data().followingUid as string))),
      () => setFollowingUids(new Set()),
    )
  }, [uid])

  const followUser = (targetUid: string, targetName: string) => {
    if (!uid || !db || uid === targetUid) return
    setDoc(doc(db, 'follows', `${uid}_${targetUid}`), {
      followerUid: uid,
      followingUid: targetUid,
      followingName: targetName,
      createdAt: Date.now(),
    })
  }

  const unfollowUser = (targetUid: string) => {
    if (!uid || !db) return
    deleteDoc(doc(db, 'follows', `${uid}_${targetUid}`))
  }

  // entry ids you've liked, so the heart on any post reflects your own reaction
  const [likedEntryIds, setLikedEntryIds] = useState<Set<string>>(new Set())
  useEffect(() => {
    if (!uid || !db) {
      setLikedEntryIds(new Set())
      return
    }
    const q = query(collection(db, 'likes'), where('uid', '==', uid))
    return onSnapshot(
      q,
      (snap) => setLikedEntryIds(new Set(snap.docs.map((d) => d.data().entryId as string))),
      () => setLikedEntryIds(new Set()),
    )
  }, [uid])

  const toggleLike = (entryId: string) => {
    if (!uid || !db) return
    const id = `${entryId}_${uid}`
    if (likedEntryIds.has(entryId)) {
      deleteDoc(doc(db, 'likes', id)).catch(reportFailure('remove that like'))
    } else {
      setDoc(doc(db, 'likes', id), { entryId, uid, createdAt: Date.now() }).catch(reportFailure('save that like'))
    }
  }

  const addEntry = (e: Entry) => {
    if (!uid || !db) return
    setDoc(doc(db, 'users', uid, 'entries', e.id), {
      ...e,
      authorUid: uid,
      authorName: profile.name,
      authorColor: 'persianRed',
      authorPhoto: profile.photo ?? null,
    }).catch(reportFailure('save your entry'))
  }

  const updateEntry = (id: string, patch: EntryPatch) => {
    if (!uid || !db) return
    updateDoc(doc(db, 'users', uid, 'entries', id), patch).catch(reportFailure('save your changes'))
  }

  // soft delete: moves the entry to Recently Deleted instead of erasing it outright
  const deleteEntry = (id: string) => {
    if (!uid || !db) return
    updateDoc(doc(db, 'users', uid, 'entries', id), { deletedAt: Date.now() }).catch(reportFailure('delete that entry'))
  }

  const restoreEntry = (id: string) => {
    if (!uid || !db) return
    updateDoc(doc(db, 'users', uid, 'entries', id), { deletedAt: deleteField() }).catch(reportFailure('restore that entry'))
  }

  const permanentlyDeleteEntry = (id: string) => {
    if (!uid || !db) return
    deleteDoc(doc(db, 'users', uid, 'entries', id)).catch(reportFailure('permanently delete that entry'))
  }

  const addCircle = (c: Omit<Circle, 'memberUids' | 'members' | 'entries'>) => {
    if (!uid || !db) return
    setDoc(doc(db, 'circles', c.id), {
      name: c.name,
      description: c.description,
      cover: c.cover,
      memberUids: [uid],
      members: [],
    }).catch(reportFailure('create that circle'))
  }

  const joinCircle = async (circleId: string) => {
    if (!uid || !db) return
    try {
      await updateDoc(doc(db, 'circles', circleId), {
        memberUids: arrayUnion(uid),
        members: arrayUnion({ id: uid, name: profile.name, color: 'persianRed', photo: profile.photo ?? null }),
      })
    } catch (err) {
      reportFailure('join that circle')(err)
    }
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
      photos: entry.photos ?? null,
      fullText: entryBodyText(entry, templateQuestions) || null,
    }).catch(reportFailure('share that entry to the circle'))
  }

  const deleteCircleEntry = (circleId: string, entryId: string) => {
    if (!uid || !db) return
    deleteDoc(doc(db, 'circles', circleId, 'entries', entryId)).catch(reportFailure('delete that shared entry'))
  }

  const deleteCircle = (circleId: string) => {
    if (!uid || !db) return
    const database = db
    const circle = circles.find((c) => c.id === circleId)
    ;(async () => {
      try {
        if (circle) {
          await Promise.all(circle.entries.map((e) => deleteDoc(doc(database, 'circles', circleId, 'entries', e.id))))
          await deleteDoc(doc(database, 'circles', circleId, 'meta', 'chat')).catch(() => {})
        }
        await deleteDoc(doc(database, 'circles', circleId))
      } catch (err) {
        reportFailure('delete that circle')(err)
      }
    })()
  }

  const updateProfile = (patch: Partial<Profile>) => {
    if (!uid || !db) return
    updateDoc(doc(db, 'users', uid), patch).catch(reportFailure('save your profile'))
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
  const locate = (
    targetId: string,
  ):
    | { kind: 'personal'; entry: Entry }
    | { kind: 'circleEntry'; circleId: string; entry: CircleEntry }
    | { kind: 'chat'; circleId: string }
    | { kind: 'public'; ownerUid: string; entry: ExplorePost }
    | null => {
    const personal = allEntries.find((e) => e.id === targetId)
    if (personal) return { kind: 'personal', entry: personal }
    for (const c of circles) {
      if (c.id === targetId) return { kind: 'chat', circleId: c.id }
      const ce = c.entries.find((e) => e.id === targetId)
      if (ce) return { kind: 'circleEntry', circleId: c.id, entry: ce }
    }
    const publicPost = explorePublicPosts.find((p) => p.id === targetId)
    if (publicPost) return { kind: 'public', ownerUid: publicPost.ownerUid, entry: publicPost }
    return null
  }

  const commentsFor = (targetId: string): Comment[] => {
    const loc = locate(targetId)
    if (!loc) return []
    if (loc.kind === 'personal') return loc.entry.comments ?? []
    if (loc.kind === 'circleEntry') return loc.entry.comments ?? []
    if (loc.kind === 'public') return loc.entry.comments ?? []
    return circleChats[loc.circleId] ?? []
  }

  const writeComments = (targetId: string, next: Comment[]) => {
    if (!uid || !db) return
    const loc = locate(targetId)
    if (!loc) return
    if (loc.kind === 'personal') {
      updateDoc(doc(db, 'users', uid, 'entries', targetId), { comments: next }).catch(reportFailure('save that comment'))
    } else if (loc.kind === 'circleEntry') {
      updateDoc(doc(db, 'circles', loc.circleId, 'entries', targetId), { comments: next }).catch(reportFailure('save that comment'))
    } else if (loc.kind === 'public') {
      updateDoc(doc(db, 'users', loc.ownerUid, 'entries', targetId), { comments: next }).catch(reportFailure('save that comment'))
    } else {
      setDoc(doc(db, 'circles', loc.circleId, 'meta', 'chat'), { messages: next }).catch(reportFailure('save that message'))
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

  const deleteComment = (targetId: string, commentId: string) => {
    writeComments(targetId, commentsFor(targetId).filter((c) => c.id !== commentId))
  }

  const patchCommentEverywhere = (commentId: string, patch: Partial<Comment>): { targetId: string; comment: Comment } | null => {
    for (const e of allEntries) {
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
    for (const p of explorePublicPosts) {
      if (p.comments?.some((c) => c.id === commentId)) {
        const next = p.comments.map((c) => (c.id === commentId ? { ...c, ...patch } : c))
        writeComments(p.id, next)
        return { targetId: p.id, comment: next.find((c) => c.id === commentId)! }
      }
    }
    return null
  }

  const reportComment = (_targetId: string, commentId: string, reason: FlagReason) => {
    patchCommentEverywhere(commentId, { flagged: true, flagReason: reason, flagSource: 'community', moderationStatus: 'pending' })
  }

  const pendingModerationItems = () => {
    const items: { entryId: string; comment: Comment }[] = []
    for (const e of allEntries) (e.comments ?? []).forEach((c) => c.moderationStatus === 'pending' && items.push({ entryId: e.id, comment: c }))
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
    updateDoc(doc(db, 'circles', circleId), patch).catch(reportFailure('save that circle'))
  }

  const removeMember = (circleId: string, memberId: string) => {
    if (!db) return
    const circle = circles.find((c) => c.id === circleId)
    if (!circle) return
    updateDoc(doc(db, 'circles', circleId), {
      members: circle.members.filter((m) => m.id !== memberId),
      memberUids: circle.memberUids.filter((id) => id !== memberId),
    }).catch(reportFailure('remove that member'))
  }

  const updateMemberRole = (circleId: string, memberId: string, role: MemberRole) => {
    if (!db) return
    const circle = circles.find((c) => c.id === circleId)
    if (!circle) return
    updateDoc(doc(db, 'circles', circleId), {
      members: circle.members.map((m) => (m.id === memberId ? { ...m, role } : m)),
    }).catch(reportFailure('update that member\'s role'))
  }

  const updateTemplateQuestions = (questions: TemplateQuestion[]) => {
    setTemplateQuestionsState(questions)
    if (!uid || !db) return
    updateDoc(doc(db, 'users', uid), { templateQuestions: questions }).catch(reportFailure('save your questions'))
  }

  const updateHabits = (next: HabitItem[]) => {
    setHabitsState(next)
    if (!uid || !db) return
    updateDoc(doc(db, 'users', uid), { habits: next }).catch(reportFailure('save your habits'))
  }

  const toggleHabit = (date: string, habitId: string) => {
    if (!uid || !db) return
    const current = habitLogs[date] ?? []
    const next = current.includes(habitId) ? current.filter((id) => id !== habitId) : [...current, habitId]
    setHabitLogs((prev) => ({ ...prev, [date]: next }))
    setDoc(doc(db, 'users', uid, 'habitLogs', date), { completed: next }).catch(reportFailure('save that habit'))
  }

  const addTravelEntry = (e: Omit<TravelEntry, 'id'>) => {
    if (!uid || !db) return
    const id = `tr-${Date.now()}`
    setDoc(doc(db, 'users', uid, 'travel', id), e).catch(reportFailure('save that trip'))
  }

  const updateTravelEntry = (id: string, patch: TravelPatch) => {
    if (!uid || !db) return
    updateDoc(doc(db, 'users', uid, 'travel', id), patch).catch(reportFailure('save that trip'))
  }

  const deleteTravelEntry = (id: string) => {
    if (!uid || !db) return
    deleteDoc(doc(db, 'users', uid, 'travel', id)).catch(reportFailure('delete that trip'))
  }

  const value = useMemo(
    () => ({
      ready,
      entries,
      deletedEntries,
      addEntry,
      updateEntry,
      deleteEntry,
      restoreEntry,
      permanentlyDeleteEntry,
      circles,
      addCircle,
      joinCircle,
      shareEntryToCircle,
      deleteCircleEntry,
      deleteCircle,
      profile,
      updateProfile,
      readCircleEntryIds: readIds,
      unreadCountForCircle,
      totalUnreadCount,
      markCircleRead,
      commentsFor,
      addComment,
      deleteComment,
      updateCircle,
      removeMember,
      updateMemberRole,
      templateQuestions,
      updateTemplateQuestions,
      reportComment,
      pendingModerationItems,
      resolveModeration,
      explorePublicPosts,
      followingUids,
      followUser,
      unfollowUser,
      habits,
      updateHabits,
      habitLogs,
      toggleHabit,
      likedEntryIds,
      toggleLike,
      travelEntries,
      addTravelEntry,
      updateTravelEntry,
      deleteTravelEntry,
    }),
    [
      ready,
      entries,
      deletedEntries,
      circles,
      profile,
      readIds,
      templateQuestions,
      explorePublicPosts,
      followingUids,
      uid,
      habits,
      habitLogs,
      likedEntryIds,
      travelEntries,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
