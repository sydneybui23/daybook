import type { IconId } from './types'

const RULES: Array<[RegExp, IconId]> = [
  [/picnic|park|blanket/i, 'picnic'],
  [/lobster|dive|diving|snorkel|cove/i, 'lobsterDive'],
  [/cry|crying|sob|ice cream|tears/i, 'cryIceCream'],
  [/ocean|swim|beach|waves|surf/i, 'waves'],
  [/hike|mountain|trail|summit/i, 'mountain'],
  [/rain|storm|cozy|stayed in/i, 'rain'],
  [/coffee|cafe|latte/i, 'coffee'],
  [/book|read|reading|novel/i, 'book'],
  [/love|heart|friend|family|date/i, 'heart'],
  [/party|birthday|celebrat|confetti/i, 'confetti'],
  [/fire|bonfire|campfire|smore/i, 'campfire'],
  [/sun|good day|great day|happy/i, 'sun'],
]

export function pickIcon(text: string): IconId {
  for (const [re, icon] of RULES) {
    if (re.test(text)) return icon
  }
  return 'sun'
}
