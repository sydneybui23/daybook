import { useState } from 'react'
import { Camera, Bell, Share2, LogOut, Pencil, ListChecks, Trash2, Plus, ShieldCheck, ShieldAlert, Globe } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { useAuth } from '../lib/auth'
import { initials } from '../lib/avatars'
import { TEMPLATE_QUESTIONS } from '../lib/data'
import { paletteHex } from '../lib/palette'
import { fileToCompressedDataUrl } from '../lib/imageUtils'

const TIMEZONES: string[] =
  typeof Intl.supportedValuesOf === 'function'
    ? Intl.supportedValuesOf('timeZone')
    : ['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo']

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className="relative h-8 w-16 shrink-0 rounded-full border p-1 transition-colors duration-300"
      style={{
        background: on ? paletteHex('oceanWhisper') : '#ffffff',
        borderColor: on ? paletteHex('oceanWhisper') : '#d7d4d0',
      }}
    >
      <span
        className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[8.5px] font-semibold uppercase tracking-tight text-[var(--ink)] shadow-sm transition-transform duration-300 ease-in-out"
        style={{ transform: on ? 'translateX(32px)' : 'translateX(0px)' }}
      >
        {on ? 'on' : 'off'}
      </span>
    </button>
  )
}

export function Profile() {
  const { profile, updateProfile, templateQuestions, updateTemplateQuestions } = useStore()
  const { signOut } = useAuth()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(profile.name)
  const [bio, setBio] = useState(profile.bio)
  const [editingQuestions, setEditingQuestions] = useState(false)
  const [draftQuestions, setDraftQuestions] = useState(templateQuestions)

  const saveQuestions = () => {
    updateTemplateQuestions(draftQuestions.filter((q) => q.label.trim().length > 0))
    setEditingQuestions(false)
  }

  const onPhotoFile = async (file: File) => {
    const dataUrl = await fileToCompressedDataUrl(file, 500, 0.8)
    updateProfile({ photo: dataUrl })
  }

  const save = () => {
    updateProfile({ name: name.trim() || profile.name, bio: bio.trim() })
    setEditing(false)
  }

  return (
    <div className="mx-auto max-w-5xl px-6 pb-32 pt-10">
      <h1 className="text-[32px] leading-tight" style={{ fontFamily: 'var(--font-serif)', fontWeight: 400 }}>
        Profile
      </h1>
      <p className="mt-2 text-[14.5px] text-[var(--ink-soft)]">
        Customize your account and journal set-up to reflect who you are.
      </p>

      <div className="mt-8 flex flex-col items-center rounded-2xl border border-[var(--line)] p-8 text-center">
        <label className="relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full text-white"
          style={{ background: profile.photo ? undefined : 'var(--accent)' }}
        >
          {profile.photo ? (
            <img src={profile.photo} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-2xl">{initials(profile.name)}</span>
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition-opacity hover:bg-black/40 hover:opacity-100">
            <Camera size={20} />
          </span>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onPhotoFile(e.target.files[0])} />
        </label>

        {editing ? (
          <div className="mt-5 flex w-full max-w-xs flex-col gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="rounded-xl border border-[var(--line)] p-2.5 text-center text-[15px] outline-none focus:border-[var(--accent)]"
            />
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A little bio"
              rows={2}
              className="resize-none rounded-xl border border-[var(--line)] p-2.5 text-center text-[13px] outline-none focus:border-[var(--accent)]"
            />
            <button onClick={save} className="rounded-full bg-[var(--ink)] px-5 py-2 text-sm text-white">
              Save
            </button>
          </div>
        ) : (
          <>
            <h2 className="mt-4 text-[19px]" style={{ fontFamily: 'var(--font-serif)', fontWeight: 400 }}>
              {profile.name}
            </h2>
            <p className="mt-1 text-[13.5px] text-[var(--ink-soft)]">{profile.bio}</p>
            <button
              onClick={() => {
                setName(profile.name)
                setBio(profile.bio)
                setEditing(true)
              }}
              className="mt-4 flex items-center gap-1.5 rounded-full border border-[var(--line)] px-4 py-1.5 text-[13px] text-[var(--ink-soft)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              <Pencil size={13} /> Edit profile
            </button>
          </>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-[var(--line)]">
        <div className="flex items-center gap-3 border-b border-[var(--line)] p-4">
          <Bell size={18} className="text-[var(--ink-soft)]" />
          <div className="flex-1">
            <p className="text-[14px] text-[var(--ink)]">Daily reminder</p>
            <p className="text-[12px] text-[var(--ink-soft)]">A nudge each evening to write today's entry.</p>
          </div>
          <Toggle on={profile.dailyReminder} onClick={() => updateProfile({ dailyReminder: !profile.dailyReminder })} />
        </div>
        {profile.dailyReminder && (
          <div className="flex items-center gap-3 border-b border-[var(--line)] p-4 pl-[45px]">
            <p className="flex-1 text-[13px] text-[var(--ink-soft)]">Remind me at</p>
            <input
              type="time"
              value={profile.reminderTime}
              onChange={(e) => updateProfile({ reminderTime: e.target.value })}
              className="rounded-lg border border-[var(--line)] bg-white p-2 text-[13px] text-[var(--ink)] outline-none focus:border-[var(--accent)]"
            />
          </div>
        )}
        <div className="flex items-center gap-3 p-4">
          <Share2 size={18} className="text-[var(--ink-soft)]" />
          <div className="flex-1">
            <p className="text-[14px] text-[var(--ink)]">Share entries by default</p>
            <p className="text-[12px] text-[var(--ink-soft)]">New entries are visible to your circles right away.</p>
          </div>
          <Toggle on={profile.shareByDefault} onClick={() => updateProfile({ shareByDefault: !profile.shareByDefault })} />
        </div>
        <div className="flex items-center gap-3 border-t border-[var(--line)] p-4">
          <Globe size={18} className="shrink-0 text-[var(--ink-soft)]" />
          <div className="flex-1">
            <p className="text-[14px] text-[var(--ink)]">Time zone</p>
            <p className="text-[12px] text-[var(--ink-soft)]">Used so "today" always lines up with where you are.</p>
          </div>
          <select
            value={profile.timezone}
            onChange={(e) => updateProfile({ timezone: e.target.value })}
            className="max-w-[160px] rounded-lg border border-[var(--line)] bg-white p-2 text-[12.5px] text-[var(--ink)] outline-none focus:border-[var(--accent)]"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-[var(--line)] p-5">
        <div className="mb-1 flex items-center gap-2">
          <ListChecks size={17} className="text-[var(--ink-soft)]" />
          <p className="text-[14px] text-[var(--ink)]">Your journal questions</p>
        </div>
        <p className="mb-4 text-[12px] text-[var(--ink-soft)]">
          Pre-load the questions your guided template asks each day.
        </p>

        {editingQuestions ? (
          <div className="flex flex-col gap-2.5">
            {draftQuestions.map((q, i) => (
              <div key={q.id} className="flex items-center gap-2">
                <input
                  value={q.label}
                  onChange={(e) =>
                    setDraftQuestions((prev) => prev.map((p, idx) => (idx === i ? { ...p, label: e.target.value } : p)))
                  }
                  placeholder="Write a question..."
                  className="min-w-0 flex-1 rounded-lg border border-[var(--line)] p-2.5 text-[13.5px] outline-none focus:border-[var(--accent)]"
                  style={{ fontFamily: 'var(--font-serif)' }}
                />
                <button
                  onClick={() => setDraftQuestions((prev) => prev.filter((_, idx) => idx !== i))}
                  aria-label="Delete question"
                  className="shrink-0 text-[var(--ink-soft)] hover:text-[var(--accent)]"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}

            <button
              onClick={() => setDraftQuestions((prev) => [...prev, { id: `q-${Date.now()}`, label: '' }])}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--line)] py-2 text-[12.5px] text-[var(--ink-soft)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              <Plus size={14} /> Add question
            </button>

            <div className="mt-1 flex items-center justify-between">
              <button
                onClick={() => setDraftQuestions(TEMPLATE_QUESTIONS)}
                className="text-[12.5px] text-[var(--ink-soft)] hover:text-[var(--accent)]"
              >
                Reset to default
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setDraftQuestions(templateQuestions)
                    setEditingQuestions(false)
                  }}
                  className="rounded-full px-4 py-1.5 text-[13px] text-[var(--ink-soft)]"
                >
                  Cancel
                </button>
                <button onClick={saveQuestions} className="rounded-full bg-[var(--ink)] px-4 py-1.5 text-[13px] text-white">
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <ol className="flex flex-col gap-1.5">
              {templateQuestions.map((q, i) => (
                <li key={q.id} className="text-[13px] text-[var(--ink)]" style={{ fontFamily: 'var(--font-serif)' }}>
                  <span className="text-[var(--ink-soft)]">{i + 1}.</span> {q.label}
                </li>
              ))}
            </ol>
            <button
              onClick={() => {
                setDraftQuestions(templateQuestions)
                setEditingQuestions(true)
              }}
              className="mt-4 flex items-center gap-1.5 rounded-full border border-[var(--line)] px-4 py-1.5 text-[13px] text-[var(--ink-soft)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              <Pencil size={13} /> Edit questions
            </button>
          </>
        )}
      </div>

      <Link
        to="/terms"
        className="mt-6 flex items-center gap-2 text-[13.5px] text-[var(--ink-soft)] hover:text-[var(--accent)]"
      >
        <ShieldCheck size={16} /> Terms & data privacy
      </Link>

      <Link
        to="/moderation"
        className="mt-4 flex items-center gap-2 text-[13.5px] text-[var(--ink-soft)] hover:text-[var(--accent)]"
      >
        <ShieldAlert size={16} /> Trust & safety review
      </Link>

      <button
        onClick={() => signOut()}
        className="mt-4 flex items-center gap-2 text-[13.5px] text-[var(--ink-soft)] hover:text-[var(--accent)]"
      >
        <LogOut size={16} /> Log out
      </button>
    </div>
  )
}
