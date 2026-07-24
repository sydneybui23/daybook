import { useState } from 'react'
import { Mail, Phone, Camera, ArrowLeft } from 'lucide-react'
import { useStore } from '../lib/store'
import { TEMPLATE_QUESTIONS } from '../lib/data'
import { DAYBOOK_LOGO } from '../lib/localPhotos'
import { initials } from '../lib/avatars'
import { PrivacyContent } from '../components/PrivacyContent'
import type { TemplateQuestion } from '../lib/types'

type Step = 'welcome' | 'verify' | 'terms' | 'profile' | 'questions'
type Channel = 'email' | 'phone'

export function Onboarding() {
  const { updateProfile, updateTemplateQuestions } = useStore()
  const [step, setStep] = useState<Step>('welcome')
  const [channel, setChannel] = useState<Channel>('email')
  const [contact, setContact] = useState('')
  const [code, setCode] = useState('')
  const [agreed, setAgreed] = useState(false)

  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [photo, setPhoto] = useState<string | undefined>(undefined)
  const [questions, setQuestions] = useState<TemplateQuestion[]>(TEMPLATE_QUESTIONS)

  const onPhotoFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => setPhoto(reader.result as string)
    reader.readAsDataURL(file)
  }

  const finish = () => {
    updateProfile({
      name: name.trim() || 'Friend',
      bio: bio.trim(),
      photo,
      onboarded: true,
    })
    updateTemplateQuestions(questions.filter((q) => q.label.trim().length > 0))
  }

  return (
    <div className="mx-auto flex min-h-[100svh] w-full max-w-md flex-col justify-center px-6 py-10">
      <img src={DAYBOOK_LOGO} alt="daybook" className="mx-auto mb-10 h-40 w-40 rounded-2xl object-cover shadow-[0_4px_16px_rgba(0,0,0,0.12)]" />

      {step === 'welcome' && (
        <div className="flex flex-col gap-4">
          <p className="mb-2 text-center text-[18px] leading-relaxed text-[var(--ink-soft)]" style={{ fontFamily: 'var(--font-serif)' }}>
            A more intentional way to connect with yourself and with your friends.
          </p>
          <h1 className="text-center text-[19px] leading-tight" style={{ fontFamily: 'var(--font-serif)', fontWeight: 400 }}>
            Welcome. Let's set up your journal.
          </h1>
          <p className="mb-2 text-center text-[13.5px] text-[var(--ink-soft)]">
            Sign in to start your year in review.
          </p>

          <button
            onClick={() => setStep('terms')}
            className="flex items-center justify-center gap-2 rounded-full border border-[var(--line)] py-3 text-[14px] text-[var(--ink)] hover:border-[var(--accent)]"
          >
            <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[var(--line-soft)] text-[11px] font-bold text-[var(--ink)]">
              G
            </span>
            Continue with Google
          </button>

          <div className="my-1 flex items-center gap-3 text-[12px] text-[var(--ink-soft)]">
            <div className="h-px flex-1 bg-[var(--line)]" />
            or
            <div className="h-px flex-1 bg-[var(--line)]" />
          </div>

          <div className="flex rounded-full border border-[var(--line)] p-1">
            {(['email', 'phone'] as const).map((c) => (
              <button
                key={c}
                onClick={() => setChannel(c)}
                className={`flex-1 rounded-full py-1.5 text-[12.5px] capitalize transition-colors ${
                  channel === c ? 'bg-[var(--ink)] text-white' : 'text-[var(--ink-soft)]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 rounded-xl border border-[var(--line)] px-3 py-2.5">
            {channel === 'email' ? <Mail size={16} className="text-[var(--ink-soft)]" /> : <Phone size={16} className="text-[var(--ink-soft)]" />}
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder={channel === 'email' ? 'you@example.com' : '(555) 123-4567'}
              type={channel === 'email' ? 'email' : 'tel'}
              className="w-full bg-transparent text-[14px] outline-none"
            />
          </label>
          <button
            disabled={!contact.trim()}
            onClick={() => setStep('verify')}
            className="rounded-full bg-[var(--ink)] py-3 text-[14px] text-white disabled:opacity-30"
          >
            Send verification code
          </button>
        </div>
      )}

      {step === 'verify' && (
        <div className="flex flex-col gap-4">
          <button
            onClick={() => setStep('welcome')}
            className="flex items-center gap-1 text-[13px] text-[var(--ink-soft)] hover:text-[var(--ink)]"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <h1 className="text-center text-[20px] leading-tight" style={{ fontFamily: 'var(--font-serif)', fontWeight: 400 }}>
            Enter your code
          </h1>
          <p className="text-center text-[13px] text-[var(--ink-soft)]">
            We sent a 6-digit code to {contact || 'you'}.
          </p>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            inputMode="numeric"
            className="rounded-xl border border-[var(--line)] py-3 text-center text-[22px] tracking-[0.5em] outline-none focus:border-[var(--accent)]"
          />
          <p className="text-center text-[11.5px] text-[var(--ink-soft)]">For this demo, any 6 digits work.</p>
          <button
            disabled={code.length !== 6}
            onClick={() => setStep('terms')}
            className="rounded-full bg-[var(--ink)] py-3 text-[14px] text-white disabled:opacity-30"
          >
            Verify
          </button>
        </div>
      )}

      {step === 'terms' && (
        <div className="flex flex-col gap-4">
          <h1 className="text-center text-[20px] leading-tight" style={{ fontFamily: 'var(--font-serif)', fontWeight: 400 }}>
            Terms & data privacy
          </h1>
          <p className="text-center text-[13px] text-[var(--ink-soft)]">
            A quick summary before you start writing.
          </p>

          <div className="max-h-[320px] overflow-y-auto rounded-xl border border-[var(--line)] p-4">
            <PrivacyContent />
          </div>

          <label className="flex items-start gap-2.5 text-[12.5px] text-[var(--ink-soft)]">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent)]"
            />
            I agree to the Terms & Conditions and Privacy Policy.
          </label>

          <button
            disabled={!agreed}
            onClick={() => setStep('profile')}
            className="rounded-full bg-[var(--ink)] py-3 text-[14px] text-white disabled:opacity-30"
          >
            Continue
          </button>
        </div>
      )}

      {step === 'profile' && (
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-[20px] leading-tight" style={{ fontFamily: 'var(--font-serif)', fontWeight: 400 }}>
            Create your profile
          </h1>

          <label className="relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full text-white" style={{ background: photo ? undefined : 'var(--accent)' }}>
            {photo ? (
              <img src={photo} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl">{name ? initials(name) : <Camera size={22} />}</span>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition-opacity hover:bg-black/40 hover:opacity-100">
              <Camera size={20} />
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onPhotoFile(e.target.files[0])} />
          </label>

          <div className="flex w-full flex-col gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="rounded-xl border border-[var(--line)] p-3 text-[14px] outline-none focus:border-[var(--accent)]"
            />
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A little bio (optional)"
              rows={2}
              className="resize-none rounded-xl border border-[var(--line)] p-3 text-[13.5px] outline-none focus:border-[var(--accent)]"
            />
          </div>

          <button
            disabled={!name.trim()}
            onClick={() => setStep('questions')}
            className="w-full rounded-full bg-[var(--ink)] py-3 text-[14px] text-white disabled:opacity-30"
          >
            Continue
          </button>
        </div>
      )}

      {step === 'questions' && (
        <div className="flex flex-col gap-4">
          <h1 className="text-center text-[20px] leading-tight" style={{ fontFamily: 'var(--font-serif)', fontWeight: 400 }}>
            Your daily journaling questions
          </h1>
          <p className="text-center text-[13px] text-[var(--ink-soft)]">
            Start with these, or make them your own. You can always change them later.
          </p>

          <div className="flex max-h-[320px] flex-col gap-2.5 overflow-y-auto pr-1">
            {questions.map((q, i) => (
              <input
                key={q.id}
                value={q.label}
                onChange={(e) =>
                  setQuestions((prev) => prev.map((p, idx) => (idx === i ? { ...p, label: e.target.value } : p)))
                }
                className="rounded-lg border border-[var(--line)] p-2.5 text-[13px] outline-none focus:border-[var(--accent)]"
                style={{ fontFamily: 'var(--font-serif)' }}
              />
            ))}
          </div>

          <button onClick={finish} className="rounded-full bg-[var(--ink)] py-3 text-[14px] text-white">
            Start journaling
          </button>
        </div>
      )}
    </div>
  )
}
