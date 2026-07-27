import { useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, UserPlus, UserCheck } from 'lucide-react'
import { useStore } from '../lib/store'
import { Avatar } from '../lib/avatars'
import { PostCard, type PostEntry } from '../components/PostCard'
import { FullEntryOverlay } from '../components/FullEntryOverlay'
import { toPostEntry } from '../lib/entryHelpers'
import { EXPLORE_SEED } from '../lib/exploreSeed'
import { useFollowerCount } from '../lib/useFollowerCount'

export function PersonProfile() {
  const { name: rawName } = useParams()
  const name = decodeURIComponent(rawName ?? '')
  const { profile, entries, circles, explorePublicPosts, templateQuestions, followingUids, followUser, unfollowUser } =
    useStore()
  const [openEntry, setOpenEntry] = useState<PostEntry | null>(null)

  const isMe = name.toLowerCase() === profile.name.toLowerCase()

  const stranger = useMemo(
    () => explorePublicPosts.find((p) => (p.authorName ?? '').toLowerCase() === name.toLowerCase()),
    [explorePublicPosts, name],
  )
  const circleMember = useMemo(
    () => circles.flatMap((c) => c.members).find((m) => m.name.toLowerCase() === name.toLowerCase()),
    [circles, name],
  )
  const seedPost = useMemo(() => EXPLORE_SEED.find((p) => p.name.toLowerCase() === name.toLowerCase()), [name])

  // a real Firebase uid, if we can find one — from a public post's author or
  // a shared circle. Seed/demo people never have one, so no follow button.
  const targetUid = stranger?.authorUid ?? circleMember?.id
  const color = isMe ? 'persianRed' : (stranger?.authorColor ?? circleMember?.color ?? seedPost?.color ?? 'oliveShadow')
  const photo = isMe ? profile.photo : (stranger?.authorPhoto ?? circleMember?.photo)

  const followerCount = useFollowerCount(isMe ? undefined : targetUid)
  const isFollowing = !!targetUid && followingUids.has(targetUid)

  const posts: PostEntry[] = useMemo(() => {
    if (isMe) {
      return entries
        .filter((e) => e.public)
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .map((e) => toPostEntry(e, profile.name, color, templateQuestions))
    }
    const real = explorePublicPosts
      .filter((p) => (p.authorName ?? '').toLowerCase() === name.toLowerCase())
      .map((p) => ({
        id: p.id,
        name: p.authorName ?? name,
        color: p.authorColor ?? 'oliveShadow',
        summary: p.summary,
        iconId: p.iconId,
        photo: p.photo,
        photos: p.photos,
        fullText: p.freeText,
        date: p.date,
      }))
    const seeded = EXPLORE_SEED.filter((p) => p.name.toLowerCase() === name.toLowerCase())
    return [...real, ...seeded].sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [isMe, entries, profile.name, color, templateQuestions, name, explorePublicPosts])

  return (
    <div className="mx-auto max-w-5xl px-6 pb-32 pt-8">
      <Link to="/social" className="mb-4 flex items-center gap-1.5 text-[13px] text-[var(--ink-soft)] hover:text-[var(--ink)]">
        <ArrowLeft size={14} /> Social
      </Link>

      <div className="flex flex-col items-center rounded-2xl border border-[var(--line)] p-8 text-center">
        {photo ? (
          <img src={photo} alt="" className="h-20 w-20 rounded-full object-cover" />
        ) : (
          <Avatar name={name} color={color} size={80} />
        )}
        <h1 className="mt-4 text-[22px]" style={{ fontFamily: 'var(--font-serif)', fontWeight: 400 }}>
          {name}
        </h1>
        <div className="mt-1 flex items-center gap-3 text-[13px] text-[var(--ink-soft)]">
          <span>
            {posts.length} public {posts.length === 1 ? 'entry' : 'entries'}
          </span>
          {!isMe && targetUid && (
            <span>
              · {followerCount ?? 0} {followerCount === 1 ? 'follower' : 'followers'}
            </span>
          )}
        </div>

        {!isMe && targetUid && (
          <button
            onClick={() => (isFollowing ? unfollowUser(targetUid) : followUser(targetUid, name))}
            className={`mt-4 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] transition-colors ${
              isFollowing
                ? 'border border-[var(--line)] text-[var(--ink-soft)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                : 'bg-[var(--ink)] text-white'
            }`}
          >
            {isFollowing ? <UserCheck size={14} /> : <UserPlus size={14} />}
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        )}
      </div>

      <div className="mt-8">
        {posts.length > 0 ? (
          <div className="flex flex-col gap-10">
            {posts.map((p) => (
              <PostCard key={p.id} entry={p} onOpen={setOpenEntry} />
            ))}
          </div>
        ) : (
          <p className="text-center text-[13.5px] text-[var(--ink-soft)]">
            {isMe ? "You haven't shared any public entries yet." : `${name} hasn't shared any public entries yet.`}
          </p>
        )}
      </div>

      {openEntry && <FullEntryOverlay entry={openEntry} onBack={() => setOpenEntry(null)} />}
    </div>
  )
}
