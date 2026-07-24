import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Image as ImageIcon } from 'lucide-react'
import { useStore } from '../lib/store'
import { CircleCard } from '../components/CircleCard'
import { PALETTE } from '../lib/palette'

const COVER_CHOICES = PALETTE.map((p) => p.id)

function CreateCircleForm({ onClose }: { onClose: () => void }) {
  const { addCircle } = useStore()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [cover, setCover] = useState<string>(COVER_CHOICES[0])

  const onFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => setCover(reader.result as string)
    reader.readAsDataURL(file)
  }

  const submit = () => {
    if (!name.trim()) return
    addCircle({
      id: `c-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || 'A private circle for sharing daily entries.',
      cover,
      members: [],
      entries: [],
    })
    onClose()
  }

  const isPhoto = cover.startsWith('data:')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-6">
        <h3 className="text-lg" style={{ fontFamily: 'var(--font-serif)' }}>
          Create a circle
        </h3>

        <div className="mt-4">
          <label className="mb-2 flex h-32 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[var(--line)] text-[var(--ink-soft)]">
            {isPhoto ? (
              <img src={cover} alt="cover" className="h-full w-full object-cover" />
            ) : (
              <span className="flex flex-col items-center gap-1 text-[12.5px]">
                <ImageIcon size={20} />
                Upload a cover photo
              </span>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          </label>
          <div className="flex flex-wrap gap-2">
            {PALETTE.map((p) => (
              <button
                key={p.id}
                title={p.name}
                onClick={() => setCover(p.id)}
                className="h-6 w-6 rounded-full border-2"
                style={{ background: p.hex, borderColor: cover === p.id ? 'var(--ink)' : 'transparent' }}
              />
            ))}
          </div>
        </div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Circle name"
          className="mt-4 w-full rounded-xl border border-[var(--line)] p-3 text-sm outline-none focus:border-[var(--accent)]"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's this circle for?"
          rows={2}
          className="mt-3 w-full resize-none rounded-xl border border-[var(--line)] p-3 text-sm outline-none focus:border-[var(--accent)]"
        />

        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-full px-4 py-2 text-sm text-[var(--ink-soft)]">
            Cancel
          </button>
          <button onClick={submit} className="rounded-full bg-[var(--ink)] px-5 py-2 text-sm text-white">
            Create
          </button>
        </div>
      </div>
    </div>
  )
}

export function Circles() {
  const { circles, unreadCountForCircle } = useStore()
  const [creating, setCreating] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-5xl px-6 pb-32 pt-10">
      <h1 className="text-[32px] leading-tight" style={{ fontFamily: 'var(--font-serif)', fontWeight: 400 }}>
        Circles
      </h1>
      <p className="mt-2 text-[14.5px] text-[var(--ink-soft)]">
        Connect with your friends in a more intentional and meaningful way through Circles.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <button
          onClick={() => setCreating(true)}
          className="flex h-[220px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--line)] text-[var(--ink-soft)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          <Plus size={22} />
          <span className="text-sm">Create a circle</span>
        </button>
        {circles.map((c) => (
          <CircleCard
            key={c.id}
            circle={c}
            onClick={() => navigate(`/circles/${c.id}`)}
            unreadCount={unreadCountForCircle(c.id)}
          />
        ))}
      </div>

      {creating && <CreateCircleForm onClose={() => setCreating(false)} />}
    </div>
  )
}
