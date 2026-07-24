import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PrivacyContent } from '../components/PrivacyContent'

export function Terms() {
  return (
    <div className="mx-auto max-w-lg px-6 pb-32 pt-10">
      <Link to="/profile" className="mb-4 flex items-center gap-1.5 text-[13px] text-[var(--ink-soft)] hover:text-[var(--ink)]">
        <ArrowLeft size={14} /> Profile
      </Link>
      <h1 className="text-[28px] leading-tight" style={{ fontFamily: 'var(--font-serif)', fontWeight: 400 }}>
        Terms & data privacy
      </h1>
      <p className="mt-2 text-[13.5px] text-[var(--ink-soft)]">
        How daybook handles your journal, your photos, and your data.
      </p>

      <div className="mt-8">
        <PrivacyContent />
      </div>
    </div>
  )
}
