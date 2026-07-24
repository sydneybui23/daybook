import { useState } from 'react'
import { DAYBOOK_LOGO } from '../lib/localPhotos'
import { useAuth } from '../lib/auth'
import { firebaseConfigured } from '../lib/firebase'

export function SignIn() {
  const { signInWithGoogle } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onClick = async () => {
    setError(null)
    setLoading(true)
    try {
      await signInWithGoogle()
    } catch {
      setError("Sign-in didn't go through. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[100svh] w-full max-w-md flex-col items-center justify-center px-6 py-10 text-center">
      <img src={DAYBOOK_LOGO} alt="daybook" className="mb-10 h-40 w-40 rounded-2xl object-cover shadow-[0_4px_16px_rgba(0,0,0,0.12)]" />
      <p className="mb-8 text-[18px] leading-relaxed text-[var(--ink-soft)]" style={{ fontFamily: 'var(--font-serif)' }}>
        A more intentional way to connect with yourself and with your friends.
      </p>

      {!firebaseConfigured ? (
        <p className="text-[13px] text-[var(--ink-soft)]">
          Sign-in isn't configured yet — this deployment is missing its Firebase environment variables.
        </p>
      ) : (
        <>
          <button
            onClick={onClick}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-[var(--line)] py-3 text-[14px] text-[var(--ink)] hover:border-[var(--accent)] disabled:opacity-50"
          >
            <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[var(--line-soft)] text-[11px] font-bold text-[var(--ink)]">
              G
            </span>
            {loading ? 'Signing in…' : 'Continue with Google'}
          </button>
          {error && <p className="mt-3 text-[12.5px] text-[var(--accent)]">{error}</p>}
        </>
      )}
    </div>
  )
}
