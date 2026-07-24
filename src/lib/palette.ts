export interface PaletteColor {
  id: string
  name: string
  hex: string
}

// Pulled from the moodboard: warm, earthy, a little moody. Used for circle
// covers, member avatars, and swatch pickers throughout the app.
export const PALETTE: PaletteColor[] = [
  { id: 'cabernet', name: 'Cabernet Clay', hex: '#331B19' },
  { id: 'inkwell', name: 'Inkwell Blue', hex: '#131C2D' },
  { id: 'morningTide', name: 'Morning Tide', hex: '#4F6F69' },
  { id: 'sproutingSage', name: 'Sprouting Sage', hex: '#717B59' },
  { id: 'vanilla', name: 'Vanilla', hex: '#F5DD99' },
  { id: 'harvestGold', name: 'Harvest Gold', hex: '#C7851B' },
  { id: 'persianRed', name: 'Persian Red', hex: '#BB4E3F' },
  { id: 'satinGold', name: 'Satin Sheen Gold', hex: '#D6AD54' },
  { id: 'oliveShadow', name: 'Olive Shadow', hex: '#49492F' },
  { id: 'ivoryClay', name: 'Ivory Clay', hex: '#BFB692' },
  { id: 'goldenSand', name: 'Golden Sand', hex: '#88623E' },
  { id: 'oceanWhisper', name: 'Ocean Whisper', hex: '#6D8C8F' },
]

const byId = new Map(PALETTE.map((p) => [p.id, p]))

export function paletteHex(id: string) {
  return byId.get(id)?.hex ?? PALETTE[0].hex
}

// A soft-to-deep two-tone gradient generated from a single palette hex,
// so we don't have to hand-author three stops per color.
export function paletteGradient(id: string, angle = 160) {
  const hex = paletteHex(id)
  return `linear-gradient(${angle}deg, color-mix(in srgb, ${hex} 45%, white) 0%, ${hex} 55%, color-mix(in srgb, ${hex} 75%, black) 100%)`
}

export function paletteIdAt(index: number) {
  return PALETTE[index % PALETTE.length].id
}

function hashStr(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

// A flat, deterministic palette color to stand in for a photo the user hasn't
// uploaded yet — no stock photos, no gradients, just one of the 12 brand colors.
export function paletteColorForSeed(seed: string) {
  return PALETTE[hashStr(seed) % PALETTE.length].hex
}
