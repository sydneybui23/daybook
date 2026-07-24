import { useState } from 'react'
import { Sparkles, Lock, Check } from 'lucide-react'
import { useStore } from '../lib/store'

const REFLECTION_QUESTIONS = [
  'You wrote about gratitude often this month, what would it look like to notice one hard thing alongside it?',
  "You haven't mentioned your goals in a couple of weeks, are they still the right ones?",
  'A few entries mention feeling behind. What would "enough" look like this season?',
]

const GOAL_SUGGESTIONS = [
  'Revisit the goal you set 90 days ago and mark it done, dropped, or still in progress.',
  'Name one relationship you want to invest in more next season.',
  'Pick a single word to anchor the next 30 days of entries.',
]

function InsightsPreview() {
  const { entries } = useStore()
  const gratitudeMentions = entries.filter((e) => /grateful|thankful|thank you/i.test(e.summary + (e.freeText ?? ''))).length

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-[12px] uppercase tracking-[0.06em] text-[var(--ink-soft)]">What we're noticing</p>
        <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--ink)]">
          You've written {entries.length} entries so far. Gratitude shows up in {gratitudeMentions} of them, but goals and
          next steps are mentioned far less. That gap between looking back and looking forward is worth a closer look.
        </p>
      </div>

      <div>
        <p className="text-[12px] uppercase tracking-[0.06em] text-[var(--ink-soft)]">Reflection questions for you</p>
        <ul className="mt-1.5 flex flex-col gap-2">
          {REFLECTION_QUESTIONS.map((q) => (
            <li key={q} className="flex gap-2 text-[13.5px] leading-relaxed text-[var(--ink)]">
              <span className="text-[var(--accent)]">•</span> {q}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-[12px] uppercase tracking-[0.06em] text-[var(--ink-soft)]">Goals for your next season</p>
        <ul className="mt-1.5 flex flex-col gap-2">
          {GOAL_SUGGESTIONS.map((g) => (
            <li key={g} className="flex gap-2 text-[13.5px] leading-relaxed text-[var(--ink)]">
              <span className="text-[var(--accent)]">•</span> {g}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function InsightsSection() {
  const { profile, updateProfile } = useStore()
  const [subscribing, setSubscribing] = useState(false)

  return (
    <div className="rounded-2xl border border-[var(--line)] p-5">
      <div className="mb-1 flex items-center gap-2">
        <Sparkles size={17} className="text-[var(--accent)]" />
        <p className="text-[15px] text-[var(--ink)]" style={{ fontFamily: 'var(--font-serif)' }}>
          Insights
        </p>
      </div>
      <p className="mb-4 text-[13px] text-[var(--ink-soft)]">
        AI reads your journal to spot gaps, suggest reflection questions, and help you set goals for the season ahead.
      </p>

      {profile.insightsSubscribed ? (
        <InsightsPreview />
      ) : (
        <div className="relative overflow-hidden rounded-xl border border-[var(--line)]">
          <div className="pointer-events-none select-none p-5 blur-[3px]">
            <InsightsPreview />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/70 p-6 text-center backdrop-blur-[1px]">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--line-soft)]">
              <Lock size={17} className="text-[var(--ink-soft)]" />
            </div>
            <p className="text-[13.5px] text-[var(--ink)]">Unlock Insights for $4.99/month</p>
            {subscribing ? (
              <div className="flex items-center gap-2 text-[12.5px] text-[var(--ink-soft)]">
                <Sparkles size={13} className="animate-pulse" /> Setting up your subscription...
              </div>
            ) : (
              <button
                onClick={() => {
                  setSubscribing(true)
                  setTimeout(() => {
                    updateProfile({ insightsSubscribed: true })
                    setSubscribing(false)
                  }, 1000)
                }}
                className="rounded-full bg-[var(--ink)] px-5 py-2 text-[13px] text-white"
              >
                Upgrade to Insights
              </button>
            )}
            <p className="text-[10.5px] text-[var(--ink-soft)]">Cancel anytime. This demo doesn't charge a real card.</p>
          </div>
        </div>
      )}

      {profile.insightsSubscribed && (
        <p className="mt-4 flex items-center gap-1.5 text-[11.5px] text-[var(--ink-soft)]">
          <Check size={12} className="text-[var(--accent)]" /> You're subscribed to Insights.
        </p>
      )}
    </div>
  )
}
