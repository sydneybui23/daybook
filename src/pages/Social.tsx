import { useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import { useAuth } from '../lib/auth'
import { PostCard, type PostEntry } from '../components/PostCard'
import { FullEntryOverlay } from '../components/FullEntryOverlay'
import { toPostEntry } from '../lib/entryHelpers'
import { EXPLORE_SEED } from '../lib/exploreSeed'

type Tab = 'explore' | 'following' | 'mine'

export function Social() {
  const { circles, profile, entries, templateQuestions, explorePublicPosts } = useStore()
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('explore')
  const [openEntry, setOpenEntry] = useState<PostEntry | null>(null)

  const following: PostEntry[] = useMemo(
    () =>
      circles.flatMap((c) =>
        c.entries.map((e) => {
          const isMe = e.memberId === user?.uid
          const member = c.members.find((m) => m.id === e.memberId)
          return {
            id: e.id,
            name: isMe ? profile.name : (member?.name ?? 'Member'),
            color: isMe ? 'persianRed' : (member?.color ?? 'oliveShadow'),
            summary: e.summary,
            iconId: e.iconId,
            photo: e.photo,
            fullText: e.fullText,
            date: e.date,
          }
        }),
      ),
    [circles, profile.name, user?.uid],
  )

  const explorePosts: PostEntry[] = useMemo(
    () =>
      explorePublicPosts.map((p) => ({
        id: p.id,
        name: p.authorName ?? 'Someone',
        color: p.authorColor ?? 'oliveShadow',
        summary: p.summary,
        iconId: p.iconId,
        photo: p.photo,
        fullText: p.freeText,
        date: p.date,
      })),
    [explorePublicPosts],
  )

  const explore: PostEntry[] = useMemo(
    () => [...following, ...explorePosts, ...EXPLORE_SEED].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [following, explorePosts],
  )

  const mine: PostEntry[] = useMemo(
    () =>
      entries
        .filter((e) => e.public)
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .map((e) => toPostEntry(e, profile.name, 'persianRed', templateQuestions)),
    [entries, profile.name, templateQuestions],
  )

  const active = tab === 'explore' ? explore : tab === 'following' ? following : mine

  return (
    <div className="mx-auto max-w-5xl px-6 pb-6 pt-10">
      <h1 className="text-[32px] leading-tight" style={{ fontFamily: 'var(--font-serif)', fontWeight: 400 }}>
        Social
      </h1>
      <p className="mt-2 text-[14.5px] text-[var(--ink-soft)]">A safe space to be yourself and to share it with others.</p>

      <div className="mt-6 flex justify-center gap-6 border-b border-[var(--line)]">
        {(['explore', 'following', 'mine'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 pb-3 text-[13px] uppercase tracking-[0.06em] ${
              tab === t ? 'border-[var(--ink)] text-[var(--ink)]' : 'border-transparent text-[var(--ink-soft)]'
            }`}
          >
            {t === 'explore' ? 'Explore' : t === 'following' ? 'Following' : 'My Public Posts'}
          </button>
        ))}
      </div>

      <div className="mt-4 h-[calc(100svh-300px)] min-h-[420px] snap-y snap-mandatory overflow-y-auto rounded-2xl pb-6" style={{ marginBottom: 88 }}>
        {active.map((entry) => (
          <div key={entry.id} className="flex min-h-full snap-start items-center justify-center py-4">
            <PostCard entry={entry} onOpen={setOpenEntry} />
          </div>
        ))}
        {active.length === 0 && (
          <p className="pt-10 text-center text-[13.5px] text-[var(--ink-soft)]">
            {tab === 'following'
              ? 'Join a circle to see friends’ entries here.'
              : tab === 'mine'
                ? "You haven't shared any entries publicly yet."
                : 'Nothing to explore yet. Share an entry publicly and it will show up here for everyone.'}
          </p>
        )}
      </div>

      {openEntry && <FullEntryOverlay entry={openEntry} onBack={() => setOpenEntry(null)} />}
    </div>
  )
}
