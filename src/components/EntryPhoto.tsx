import { paletteColorForSeed } from '../lib/palette'
import type { IconId } from '../lib/types'

export function EntryPhoto({
  photo,
  iconId,
  seed,
  size = 48,
  radius = '9999px',
  className,
}: {
  photo?: string
  iconId: IconId
  seed?: string
  size?: number
  radius?: string
  className?: string
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden ${className ?? ''}`}
      style={{ width: size, height: size, borderRadius: radius }}
    >
      {photo ? (
        <img src={photo} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full" style={{ background: paletteColorForSeed(seed ?? iconId) }} />
      )}
    </div>
  )
}
