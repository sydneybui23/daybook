import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'
import { useStore } from '../lib/store'
import { CircleCard } from '../components/CircleCard'
import { MembersList } from '../components/MembersList'
import { CircleChat } from '../components/CircleChat'
import { ShareToCircleModal } from '../components/ShareToCircleModal'
import { EditCircleModal } from '../components/EditCircleModal'

export function CircleDetail() {
  const { id } = useParams()
  const { circles, markCircleRead } = useStore()
  const circle = circles.find((c) => c.id === id)
  const [sharing, setSharing] = useState(false)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (circle) markCircleRead(circle.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [circle?.id])

  if (!circle) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16 text-center text-[var(--ink-soft)]">
        Circle not found. <Link to="/circles" className="underline">Back to circles</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-6 pb-32 pt-8">
      <Link to="/circles" className="mb-4 flex items-center gap-1.5 text-[13px] text-[var(--ink-soft)] hover:text-[var(--ink)]">
        <ArrowLeft size={14} /> Circles
      </Link>

      <CircleCard circle={circle} height={280} onEdit={() => setEditing(true)} />

      <button
        onClick={() => setSharing(true)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--line)] py-3 text-[13.5px] text-[var(--ink-soft)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
      >
        <Send size={16} /> Share to {circle.name}
      </button>

      <div className="mt-8">
        <MembersList circleId={circle.id} circleName={circle.name} members={circle.members} />
      </div>

      <div className="mt-8">
        <h2 className="mb-5 text-lg" style={{ fontFamily: 'var(--font-serif)', fontWeight: 400 }}>
          Today in this circle
        </h2>
        <CircleChat circle={circle} />
      </div>

      {sharing && <ShareToCircleModal circleId={circle.id} circleName={circle.name} onClose={() => setSharing(false)} />}
      {editing && <EditCircleModal circle={circle} onClose={() => setEditing(false)} />}
    </div>
  )
}
