import { paletteGradient } from './palette'

export function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function Avatar({
  name,
  color = 'persianRed',
  size = 40,
}: {
  name: string
  color?: string
  size?: number
}) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-medium text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: paletteGradient(color, 135),
      }}
    >
      {initials(name)}
    </div>
  )
}
