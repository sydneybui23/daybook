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

export interface Comment {
  id: string
  author: string
  authorColor: string
  text: string
  sticker: boolean
  createdAt: number
  flagged?: boolean
  flagReason?: 'bullying' | 'racism' | 'hate' | 'other'
  flagSource?: 'ai' | 'community'
  moderationStatus?: 'pending' | 'approved' | 'rejected'
}

export interface Entry {
  id: string
  date: string // ISO yyyy-mm-dd
  summary: string
  iconId: IconId // used only as a fallback mood tag when no photo is set
  mode: EntryMode
  photo?: string // data URL of a user-uploaded photo for the day (photos[0], kept for older readers)
  photos?: string[] // full gallery of uploaded photos for the day
  freeText?: string
  answers?: Record<string, string>
  sharedCircleIds?: string[]
  public?: boolean
  comments?: Comment[]
  // denormalized author info so public/circle feeds can render without a join
  authorUid?: string
  authorName?: string
  authorColor?: string
  authorPhoto?: string
}

export interface TemplateQuestion {
  id: string
  label: string
}

export type MemberRole = 'admin' | 'member'

export interface Member {
  id: string // the member's real Firebase uid
  name: string
  color: string // avatar gradient key
  photo?: string
  journalHint?: string
  role?: MemberRole
}

export interface CircleEntry {
  id: string
  memberId: string // the author's real Firebase uid
  date: string
  summary: string
  iconId: IconId
  photo?: string
  photos?: string[]
  fullText?: string
  comments?: Comment[]
}

export interface Circle {
  id: string
  name: string
  description: string
  cover: string // gradient key or data url
  memberUids: string[] // authoritative membership list for security rules/queries
  members: Member[] // denormalized member profiles for display
  entries: CircleEntry[]
  generalComments?: Comment[] // standalone group-chat messages not tied to one entry
}
