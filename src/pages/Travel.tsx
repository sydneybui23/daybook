import { useMemo, useState } from 'react'
import { deleteField } from 'firebase/firestore'
import { Plane, MapPin, Plus, Trash2, Pencil, Camera, X } from 'lucide-react'
import { useStore } from '../lib/store'
import { fileToCompressedDataUrl } from '../lib/imageUtils'
import { COUNTRIES } from '../lib/countries'
import { WorldMap, type MapPin as Pin } from '../components/WorldMap'
import type { TravelEntry } from '../lib/types'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function countryCoords(name: string) {
  return COUNTRIES.find((c) => c.name === name)
}

function formatRange(t: TravelEntry) {
  const start = `${MONTHS[t.month - 1]} ${t.year}`
  if (!t.endMonth || !t.endYear || (t.endMonth === t.month && t.endYear === t.year)) return start
  const end = `${MONTHS[t.endMonth - 1]} ${t.endYear}`
  return t.endYear === t.year ? `${MONTHS[t.month - 1]} – ${end}` : `${start} – ${end}`
}

function DeleteTripButton({ onDelete }: { onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false)
  return (
    <button
      onClick={() => {
        if (!confirming) {
          setConfirming(true)
          return
        }
        onDelete()
      }}
      onBlur={() => setConfirming(false)}
      aria-label="Delete trip"
      className="shrink-0 text-[var(--ink-soft)] hover:text-[var(--accent)]"
    >
      {confirming ? <span className="text-[11px]" style={{ color: '#bb4e3f' }}>Confirm?</span> : <Trash2 size={15} />}
    </button>
  )
}

function TripIcon({ photo, size = 44 }: { photo?: string; size?: number }) {
  if (photo) {
    return <img src={photo} alt="" className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, background: 'var(--line-soft)' }}
    >
      <Plane size={size * 0.4} className="text-[var(--ink-soft)]" />
    </div>
  )
}

interface TripFormProps {
  planned: boolean
  initial?: TravelEntry
  submitLabel: string
  onSubmit: (patch: Omit<TravelEntry, 'id'>) => void
  onCancel?: () => void
}

function TripForm({ planned, initial, submitLabel, onSubmit, onCancel }: TripFormProps) {
  const [country, setCountry] = useState(initial?.country ?? COUNTRIES[0].name)
  const [city, setCity] = useState(initial?.city ?? '')
  const [month, setMonth] = useState(initial?.month ?? new Date().getMonth() + 1)
  const [year, setYear] = useState(initial?.year ?? new Date().getFullYear())
  const [multiMonth, setMultiMonth] = useState(!!(initial?.endMonth && initial?.endYear))
  const [endMonth, setEndMonth] = useState(initial?.endMonth ?? initial?.month ?? new Date().getMonth() + 1)
  const [endYear, setEndYear] = useState(initial?.endYear ?? initial?.year ?? new Date().getFullYear())
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [photo, setPhoto] = useState<string | undefined>(initial?.photo)

  const onPhotoFile = async (file: File) => {
    try {
      setPhoto(await fileToCompressedDataUrl(file, 500, 0.7))
    } catch {
      alert("Couldn't read that photo — try a JPEG, PNG, or screenshot.")
    }
  }

  const submit = () => {
    if (multiMonth && endYear * 12 + endMonth < year * 12 + month) {
      alert("The end month can't be before the start month.")
      return
    }
    onSubmit({
      country,
      city: city.trim() || undefined,
      month,
      year,
      endMonth: multiMonth ? endMonth : undefined,
      endYear: multiMonth ? endYear : undefined,
      planned,
      notes: notes.trim() || undefined,
      photo,
    })
  }

  return (
    <div>
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <TripIcon photo={photo} size={52} />
          <label className="absolute -bottom-1 -right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-[var(--ink)] text-white">
            <Camera size={12} />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onPhotoFile(e.target.files[0])}
            />
          </label>
          {photo && (
            <button
              onClick={() => setPhoto(undefined)}
              aria-label="Remove photo"
              className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
            >
              <X size={11} />
            </button>
          )}
        </div>

        <div className="grid flex-1 gap-3 sm:grid-cols-2">
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="rounded-lg border border-[var(--line)] bg-white p-2.5 text-[13.5px] text-[var(--ink)] outline-none focus:border-[var(--accent)]"
          >
            {COUNTRIES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City (optional)"
            className="rounded-lg border border-[var(--line)] p-2.5 text-[13.5px] text-[var(--ink)] outline-none focus:border-[var(--accent)]"
          />
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="rounded-lg border border-[var(--line)] bg-white p-2.5 text-[13.5px] text-[var(--ink)] outline-none focus:border-[var(--accent)]"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-lg border border-[var(--line)] p-2.5 text-[13.5px] text-[var(--ink)] outline-none focus:border-[var(--accent)]"
          />
        </div>
      </div>

      <label className="mt-3 flex items-center gap-2 text-[13px] text-[var(--ink)]">
        <input
          type="checkbox"
          checked={multiMonth}
          onChange={(e) => {
            setMultiMonth(e.target.checked)
            if (e.target.checked) {
              setEndMonth(month)
              setEndYear(year)
            }
          }}
          className="h-4 w-4 accent-[var(--accent)]"
        />
        This trip spanned more than one month
      </label>

      {multiMonth && (
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <select
            value={endMonth}
            onChange={(e) => setEndMonth(Number(e.target.value))}
            className="rounded-lg border border-[var(--line)] bg-white p-2.5 text-[13.5px] text-[var(--ink)] outline-none focus:border-[var(--accent)]"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                Ends {m}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={endYear}
            onChange={(e) => setEndYear(Number(e.target.value))}
            placeholder="End year"
            className="rounded-lg border border-[var(--line)] p-2.5 text-[13.5px] text-[var(--ink)] outline-none focus:border-[var(--accent)]"
          />
        </div>
      )}

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        rows={2}
        className="mt-3 w-full resize-none rounded-lg border border-[var(--line)] p-2.5 text-[13.5px] text-[var(--ink)] outline-none focus:border-[var(--accent)]"
      />
      <div className="mt-3 flex items-center gap-2">
        <button onClick={submit} className="flex items-center gap-1.5 rounded-full bg-[var(--ink)] px-4 py-2 text-[13px] text-white">
          <Plus size={14} /> {submitLabel}
        </button>
        {onCancel && (
          <button onClick={onCancel} className="rounded-full px-4 py-2 text-[13px] text-[var(--ink-soft)]">
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}

export function Travel() {
  const { travelEntries, addTravelEntry, updateTravelEntry, deleteTravelEntry } = useStore()
  const [planning, setPlanning] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const filtered = useMemo(
    () => travelEntries.filter((t) => t.planned === planning),
    [travelEntries, planning],
  )

  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) =>
        planning ? (a.year === b.year ? a.month - b.month : a.year - b.year) : b.year === a.year ? b.month - a.month : b.year - a.year,
      ),
    [filtered, planning],
  )

  const pins: Pin[] = useMemo(
    () =>
      filtered
        .map((t) => {
          const coords = countryCoords(t.country)
          if (!coords) return null
          return { id: t.id, lat: coords.lat, lng: coords.lng, label: `${t.country}${t.city ? ` — ${t.city}` : ''}` }
        })
        .filter((p): p is Pin => p !== null),
    [filtered],
  )

  const visitedCount = new Set(travelEntries.filter((t) => !t.planned).map((t) => t.country)).size

  const saveEdit = (id: string, patch: Omit<TravelEntry, 'id'>) => {
    updateTravelEntry(id, {
      ...patch,
      endMonth: patch.endMonth ?? deleteField(),
      endYear: patch.endYear ?? deleteField(),
      city: patch.city ?? deleteField(),
      notes: patch.notes ?? deleteField(),
      photo: patch.photo ?? deleteField(),
    })
    setEditingId(null)
  }

  return (
    <div className="mx-auto max-w-5xl px-6 pb-32 pt-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[32px] leading-tight" style={{ fontFamily: 'var(--font-serif)', fontWeight: 400 }}>
            Travel
          </h1>
          <p className="mt-2 text-[14.5px] text-[var(--ink-soft)]">
            {visitedCount} {visitedCount === 1 ? 'country' : 'countries'} visited so far.
          </p>
        </div>
        <div className="mt-1 flex shrink-0 gap-1 rounded-full border border-[var(--line)] p-1">
          <button
            onClick={() => setPlanning(false)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] transition-colors ${
              !planning ? 'bg-[var(--ink)] text-white' : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
            }`}
          >
            <MapPin size={14} /> Where I've been
          </button>
          <button
            onClick={() => setPlanning(true)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] transition-colors ${
              planning ? 'bg-[var(--ink)] text-white' : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
            }`}
          >
            <Plane size={14} /> Planning ahead
          </button>
        </div>
      </div>

      <div className="mt-8">
        <WorldMap pins={pins} />
      </div>

      <div className="mt-8 rounded-2xl border border-[var(--line)] p-5">
        <p className="mb-4 text-[13px] uppercase tracking-[0.06em] text-[var(--ink-soft)]">
          {planning ? 'Add a trip you\'re planning' : 'Add a trip you took'}
        </p>
        <TripForm
          planned={planning}
          submitLabel={planning ? 'Add planned trip' : 'Add trip'}
          onSubmit={(trip) => addTravelEntry(trip)}
        />
      </div>

      <div className="mt-8 flex flex-col gap-2.5">
        {sorted.map((t) =>
          editingId === t.id ? (
            <div key={t.id} className="rounded-2xl border border-[var(--accent)]/40 p-4">
              <TripForm
                planned={t.planned}
                initial={t}
                submitLabel="Save changes"
                onSubmit={(patch) => saveEdit(t.id, patch)}
                onCancel={() => setEditingId(null)}
              />
            </div>
          ) : (
            <div key={t.id} className="flex items-center gap-3 rounded-2xl border border-[var(--line)] p-4">
              <TripIcon photo={t.photo} />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] text-[var(--ink)]" style={{ fontFamily: 'var(--font-serif)' }}>
                  {t.country}
                  {t.city ? `, ${t.city}` : ''}
                </p>
                <p className="text-[12px] text-[var(--ink-soft)]">
                  {formatRange(t)}
                  {t.notes ? ` · ${t.notes}` : ''}
                </p>
              </div>
              <button
                onClick={() => setEditingId(t.id)}
                aria-label="Edit trip"
                className="shrink-0 text-[var(--ink-soft)] hover:text-[var(--ink)]"
              >
                <Pencil size={14} />
              </button>
              <DeleteTripButton onDelete={() => deleteTravelEntry(t.id)} />
            </div>
          ),
        )}
        {sorted.length === 0 && (
          <p className="text-center text-[13.5px] text-[var(--ink-soft)]">
            {planning ? "No trips planned yet — add one above." : "No trips logged yet — add your first one above."}
          </p>
        )}
      </div>
    </div>
  )
}
