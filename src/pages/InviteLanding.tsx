import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useStore } from '../lib/store'
import { paletteGradient } from '../lib/palette'

interface CirclePreview {
  name: string
  description: string
  cover: string
  memberCount: number
}

export function InviteLanding() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { joinCircle } = useStore()
  const [preview, setPreview] = useState<CirclePreview | null | undefined>(undefined)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    if (!id || !db) {
      setPreview(null)
      return
    }
    getDoc(doc(db, 'circles', id)).then((snap) => {
      if (!snap.exists()) {
        setPreview(null)
        return
      }
      const data = snap.data()
      setPreview({
        name: data.name,
        description: data.description,
        cover: data.cover,
        memberCount: (data.memberUids ?? []).length,
      })
    })
  }, [id])

  const join = async () => {
    if (!id) return
    setJoining(true)
    await joinCircle(id)
    navigate(`/circles/${id}`)
  }

  if (preview === undefined) {
    return <div className="mx-auto max-w-md px-6 py-20 text-center text-[var(--ink-soft)]">Loading invite…</div>
  }

  if (preview === null) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center text-[var(--ink-soft)]">
        This invite link isn't valid anymore.
      </div>
    )
  }

  const isPhotoCover = preview.cover.startsWith('data:') || preview.cover.startsWith('/') || preview.cover.startsWith('http')

  return (
    <div className="mx-auto max-w-md px-6 pb-24 pt-12 text-center">
      <p className="text-[13px] uppercase tracking-[0.08em] text-[var(--accent)]">You're invited</p>
      <h1 className="mt-2 text-[26px] leading-tight" style={{ fontFamily: 'var(--font-serif)', fontWeight: 400 }}>
        Join {preview.name} on daybook
      </h1>
      <p className="mt-2 text-[14px] text-[var(--ink-soft)]">{preview.description}</p>

      <div
        className="mt-6 h-[160px] w-full rounded-2xl"
        style={
          isPhotoCover
            ? { backgroundImage: `url(${preview.cover})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { background: paletteGradient(preview.cover) }
        }
      />
      <p className="mt-3 text-[12px] text-[var(--ink-soft)]">
        {preview.memberCount} {preview.memberCount === 1 ? 'member' : 'members'} so far
      </p>

      <button
        onClick={join}
        disabled={joining}
        className="mt-6 rounded-full bg-[var(--ink)] px-6 py-3 text-[14px] text-white disabled:opacity-40"
      >
        {joining ? 'Joining…' : 'Join circle'}
      </button>
    </div>
  )
}
