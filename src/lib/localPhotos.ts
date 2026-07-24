import type { IconId } from './types'

// Real photos (dropped by the user) standing in for camera-roll uploads on
// every mock entry, so nothing in the demo shows an empty placeholder. Each
// mood has a few options so entries sharing an iconId don't all look identical.
const PHOTO_POOL: Record<IconId, string[]> = {
  picnic: ['/photos/scrabble-patio.jpg', '/photos/making-pasta.jpg', '/photos/elderly-picnic-log.jpg'],
  lobsterDive: ['/photos/beach-friends.jpg', '/photos/surfers-palms.jpg'],
  cryIceCream: ['/photos/breakfast-tray.jpg', '/photos/dog-walk-bw.jpg'],
  sun: ['/photos/beach-chairs.jpg', '/photos/tropical-resort-kids.jpg'],
  coffee: ['/photos/cafe-chat.jpg', '/photos/paris-sidewalk-cafe.jpg'],
  book: ['/photos/hikers-lake.jpg', '/photos/dog-walk-bw.jpg'],
  heart: ['/photos/dinner-table.jpg', '/photos/grandma-granddaughter.jpg'],
  mountain: ['/photos/hiker-mountain.jpg', '/photos/coastal-cliffs.jpg'],
  rain: ['/photos/breakfast-tray.jpg', '/photos/dog-walk-bw.jpg'],
  confetti: ['/photos/friends-movie-night.jpg', '/photos/friends-running-field.jpg'],
  campfire: ['/photos/making-pasta.jpg', '/photos/friends-movie-night.jpg'],
  waves: ['/photos/horses-water.jpg', '/photos/coastal-cliffs.jpg', '/photos/surfers-palms.jpg'],
}

function hashStr(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

// `seed` (usually the entry id) picks a stable option from the pool so the
// same entry always renders the same photo across renders and pages.
export function photoForIcon(iconId: IconId, seed?: string) {
  const pool = PHOTO_POOL[iconId] ?? ['/photos/garden-field.jpg']
  if (!seed) return pool[0]
  return pool[hashStr(seed) % pool.length]
}

export const GARDEN_PHOTO = '/photos/garden-field.jpg'
export const SUNDAY_SUPPER_COVER = '/photos/dinner-table.jpg'
export const OLD_HOUSE_COVER = '/photos/friends-movie-night.jpg'
export const DAYBOOK_LOGO = '/photos/daybook-logo.png'
export const DAYBOOK_LOGO_HEADER = '/photos/daybook-logo-header.png'
export const HEADER_BACKGROUND = '/photos/header-background.jpg'
