export type IconId =
  | 'picnic'
  | 'lobsterDive'
  | 'cryIceCream'
  | 'sun'
  | 'coffee'
  | 'book'
  | 'heart'
  | 'mountain'
  | 'rain'
  | 'confetti'
  | 'campfire'
  | 'waves'

export type EntryMode = 'guided' | 'free'

export interface Entry {
  id: string
  date: string // ISO yyyy-mm-dd
  summary: string
  iconId: IconId // used only as a fallback mood/gradient tag when no photo is set
  mode: EntryMode
  photo?: string // data URL of a user-uploaded photo for the day
  freeText?: string
  answers?: Record<string, string>
  sharedCircleIds?: string[]
  public?: boolean
}

export interface TemplateQuestion {
  id: string
  label: string
}

export type MemberRole = 'admin' | 'member'

export interface Member {
  id: string
  name: string
  color: string // avatar gradient key
  journalHint: string // AI-generated-style clue about what they've been journaling about
  role?: MemberRole
}

export interface CircleEntry {
  id: string
  memberId: string
  date: string
  summary: string
  iconId: IconId
  photo?: string
  fullText?: string
}

export interface Circle {
  id: string
  name: string
  description: string
  cover: string // gradient key or data url
  members: Member[]
  entries: CircleEntry[]
}
