import { WORLD_LAND_PATH } from '../lib/worldLandPath'

// Real coastlines (Natural Earth 110m land polygons via world-atlas), projected
// with a simple equirectangular projection into a 1000x500 viewBox. Pins use the
// same projection as plain percentages, so they line up with the map exactly.
export interface MapPin {
  id: string
  lat: number
  lng: number
  label: string
}

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
      style={{ aspectRatio: '2 / 1', background: 'color-mix(in srgb, var(--accent) 6%, white)' }}
    >
      <svg viewBox="0 0 1000 500" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <path
          d={WORLD_LAND_PATH}
          fillRule="evenodd"
          fill="color-mix(in srgb, var(--accent) 22%, white)"
          stroke="color-mix(in srgb, var(--accent) 45%, white)"
          strokeWidth={0.6}
        />
      </svg>
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
        <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-[13px] text-[var(--ink-soft)]">
          Add a trip below to see it on the map.
        </p>
      )}
    </div>
  )
}
