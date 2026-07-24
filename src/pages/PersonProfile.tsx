import { useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useStore } from '../lib/store'
import { Avatar } from '../lib/avatars'
import { PostCard, type PostEntry } from '../components/PostCard'
import { FullEntryOverlay } from '../components/FullEntryOverlay'
import { toPostEntry } from '../lib/entryHelpers'
import { EXPLORE_SEED } from '../lib/exploreSeed'

export function PersonProfile() {
  const { name: rawName } = useParams()
  const name = decodeURIComponent(rawName ?? '')
  const { profile, entries, explorePublicPosts, templateQuestions } = useStore()
  const [openEntry, setOpenEntry] = useState<PostEntry | null>(null)

  const isMe = name.toLowerCase() === profile.name.toLowerCase()

  const stranger = useMemo(
    () => explorePublicPosts.find((p) => (p.authorName ?? '').toLowerCase() === name.toLowerCase()),
    [explorePublicPosts, name],
  )
  const seedPost = useMemo(() => EXPLORE_SEED.find((p) => p.name.toLowerCase() === name.toLowerCase()), [name])
  const color = isMe ? 'persianRed' : (stranger?.authorColor ?? seedPost?.color ?? 'oliveShadow')
  const photo = isMe ? profile.photo : stranger?.authorPhoto

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
        <p className="mt-1 text-[13px] text-[var(--ink-soft)]">
          {posts.length} public {posts.length === 1 ? 'entry' : 'entries'}
        </p>
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
