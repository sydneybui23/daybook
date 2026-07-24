import { PRIVACY_SECTIONS } from '../lib/legal'

export function PrivacyContent() {
  return (
    <div className="flex flex-col gap-5">
      {PRIVACY_SECTIONS.map((s) => (
        <div key={s.title}>
          <p className="text-[14px] text-[var(--ink)]" style={{ fontFamily: 'var(--font-serif)', fontWeight: 500 }}>
            {s.title}
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-[var(--ink-soft)]">{s.body}</p>
        </div>
      ))}
    </div>
  )
}
