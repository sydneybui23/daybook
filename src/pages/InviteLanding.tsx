import { useParams, Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { CircleCard } from '../components/CircleCard'

export function InviteLanding() {
  const { id } = useParams()
  const { circles } = useStore()
  const circle = circles.find((c) => c.id === id)

  if (!circle) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center text-[var(--ink-soft)]">
        This invite link isn't valid anymore.
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-6 pb-24 pt-12 text-center">
      <p className="text-[13px] uppercase tracking-[0.08em] text-[var(--accent)]">You're invited</p>
      <h1 className="mt-2 text-[26px] leading-tight" style={{ fontFamily: 'var(--font-serif)', fontWeight: 400 }}>
        Join {circle.name} on daybook
      </h1>
      <p className="mt-2 text-[14px] text-[var(--ink-soft)]">
        {circle.description}
      </p>

      <div className="mt-6">
        <CircleCard circle={circle} height={200} />
      </div>

      <Link
        to="/circles"
        className="mt-6 inline-block rounded-full bg-[var(--ink)] px-6 py-3 text-[14px] text-white"
      >
        Open daybook to accept
      </Link>
      <p className="mt-3 text-[12px] text-[var(--ink-soft)]">
        Sign in or create a profile first if you're new here.
      </p>
    </div>
  )
}
