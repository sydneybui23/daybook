import { ShieldAlert } from 'lucide-react'
import { useStore } from '../lib/store'

const REASON_LABEL: Record<string, string> = {
  bullying: 'bullying',
  racism: 'racism',
  hate: 'hate speech',
  other: 'a policy violation',
}

export function SocialRestricted() {
  const { profile } = useStore()

  return (
    <div className="mx-auto max-w-md px-6 pb-32 pt-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
        <ShieldAlert size={24} />
      </div>
      <h1 className="mt-5 text-[24px]" style={{ fontFamily: 'var(--font-serif)', fontWeight: 400 }}>
        Your access to Social has been restricted
      </h1>
      <p className="mt-3 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
        A comment on your account was reviewed and confirmed as {REASON_LABEL[profile.blockedReason ?? 'other']}. To keep
        this a safe space, posting to and browsing the Social tab is paused for your account. Your private journal and
        circles are unaffected.
      </p>
    </div>
  )
}
