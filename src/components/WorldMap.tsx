// A stylized, non-cartographic world map: continents are drawn as soft rounded
// regions positioned by their real bounding lat/lng box (not traced coastlines),
// while every pin is placed with an accurate equirectangular projection. Good
// enough to see "where in the world" at a glance without shipping full map data.
export interface MapPin {
  id: string
  lat: number
  lng: number
  label: string
}

const CONTINENTS: { left: number; top: number; width: number; height: number }[] = [
  { left: 2.8, top: 8.3, width: 33.3, height: 33.3 }, // North America
  { left: 26.4, top: 43.3, width: 13.9, height: 37.2 }, // South America
  { left: 47.2, top: 11.1, width: 13.9, height: 19.4 }, // Europe
  { left: 44.4, top: 29.4, width: 19.4, height: 40 }, // Africa
  { left: 61.1, top: 8.3, width: 30.6, height: 38.9 }, // Asia
  { left: 80.6, top: 55.6, width: 12.5, height: 19.4 }, // Australia
]

function project(lat: number, lng: number) {
  return {
    x: ((lng + 180) / 360) * 100,
    y: ((90 - lat) / 180) * 100,
  }
}

// small deterministic offset so repeat visits to the same country don't stack into one dot
function jitter(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 1000
  const a = (h % 100) / 100
  const b = ((h * 7) % 100) / 100
  return { dx: (a - 0.5) * 3, dy: (b - 0.5) * 3 }
}

export function WorldMap({ pins }: { pins: MapPin[] }) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-[var(--line)]"
      style={{ aspectRatio: '2 / 1', background: 'var(--line-soft)' }}
    >
      {CONTINENTS.map((c, i) => (
        <div
          key={i}
          className="absolute rounded-[38%]"
          style={{
            left: `${c.left}%`,
            top: `${c.top}%`,
            width: `${c.width}%`,
            height: `${c.height}%`,
            background: 'color-mix(in srgb, var(--accent) 16%, white)',
          }}
        />
      ))}
      {pins.map((p) => {
        const { x, y } = project(p.lat, p.lng)
        const { dx, dy } = jitter(p.id)
        return (
          <div
            key={p.id}
            className="group absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${x + dx}%`, top: `${y + dy}%` }}
          >
            <div className="h-2.5 w-2.5 rounded-full ring-2 ring-white" style={{ background: 'var(--ink)' }} />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-[var(--ink)] px-2 py-1 text-[11px] text-white opacity-0 shadow-[0_4px_12px_rgba(0,0,0,0.2)] transition-opacity group-hover:opacity-100">
              {p.label}
            </div>
          </div>
        )
      })}
      {pins.length === 0 && (
        <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-[13px] text-[var(--ink-soft)]">
          Add a trip below to see it on the map.
        </p>
      )}
    </div>
  )
}
