import { useState } from 'react'
import { Camera, Trash2 } from 'lucide-react'
import { useStore } from '../lib/store'
import { useAuth } from '../lib/auth'
import { TEMPLATE_QUESTIONS } from '../lib/data'
import { DAYBOOK_LOGO } from '../lib/localPhotos'
import { initials } from '../lib/avatars'
import { PrivacyContent } from '../components/PrivacyContent'
import { fileToCompressedDataUrl } from '../lib/imageUtils'
import type { TemplateQuestion } from '../lib/types'

type Step = 'terms' | 'profile' | 'questions'

export function Onboarding() {
  const { updateProfile, updateTemplateQuestions } = useStore()
  const { user } = useAuth()
  const [step, setStep] = useState<Step>('terms')
  const [agreed, setAgreed] = useState(false)

  const [name, setName] = useState(user?.displayName ?? '')
  const [bio, setBio] = useState('')
  const [photo, setPhoto] = useState<string | undefined>(user?.photoURL ?? undefined)
  const [questions, setQuestions] = useState<TemplateQuestion[]>(TEMPLATE_QUESTIONS)
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set(TEMPLATE_QUESTIONS.map((q) => q.id)))

  const onPhotoFile = async (file: File) => {
    try {
      setPhoto(await fileToCompressedDataUrl(file, 500, 0.8))
    } catch {
      alert("Couldn't read that photo — try a JPEG, PNG, or screenshot.")
    }
  }

  const toggleQuestionSelected = (id: string) => {
    setSelectedQuestions((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const removeQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id))
    setSelectedQuestions((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const finish = () => {
    updateProfile({
      name: name.trim() || 'Friend',
      bio: bio.trim(),
      photo,
      onboarded: true,
    })
    updateTemplateQuestions(questions.filter((q) => selectedQuestions.has(q.id) && q.label.trim().length > 0))
  }

  return (
    <div className="mx-auto flex min-h-[100svh] w-full max-w-md flex-col justify-center px-6 py-10">
      <img src={DAYBOOK_LOGO} alt="daybook" className="mx-auto mb-10 h-40 w-40 rounded-2xl object-cover shadow-[0_4px_16px_rgba(0,0,0,0.12)]" />

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
            Check the ones you want to use, not all 7 required. Edit the wording, remove any, or add your own later.
          </p>

          <div className="flex max-h-[320px] flex-col gap-2 overflow-y-auto pr-1">
            {questions.map((q, i) => (
              <div key={q.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedQuestions.has(q.id)}
                  onChange={() => toggleQuestionSelected(q.id)}
                  className="h-4 w-4 shrink-0 accent-[var(--accent)]"
                />
                <input
                  value={q.label}
                  onChange={(e) =>
                    setQuestions((prev) => prev.map((p, idx) => (idx === i ? { ...p, label: e.target.value } : p)))
                  }
                  disabled={!selectedQuestions.has(q.id)}
                  className="w-full rounded-lg border border-[var(--line)] p-2.5 text-[13px] outline-none focus:border-[var(--accent)] disabled:opacity-40"
                  style={{ fontFamily: 'var(--font-serif)' }}
                />
                <button
                  onClick={() => removeQuestion(q.id)}
                  aria-label="Remove question"
                  className="shrink-0 text-[var(--ink-soft)] hover:text-[var(--accent)]"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          <p className="text-center text-[12px] text-[var(--ink-soft)]">
            {selectedQuestions.size} of {questions.length} selected
          </p>

          <button onClick={finish} className="rounded-full bg-[var(--ink)] py-3 text-[14px] text-white">
            Start journaling
          </button>
        </div>
      )}
    </div>
  )
}
