import type { Circle, Entry, TemplateQuestion } from './types'
import { SUNDAY_SUPPER_COVER, OLD_HOUSE_COVER } from './localPhotos'

export const TEMPLATE_QUESTIONS: TemplateQuestion[] = [
  { id: 'gratitude', label: 'What are three great things that happened yesterday (gratitude)?' },
  { id: 'god', label: 'How is God moving in my life / where is He directing me?' },
  { id: 'scripture', label: 'What did I reflect on in Scripture today?' },
  { id: 'lookingForward', label: 'What are you looking forward to right now?' },
  { id: 'becomingHer', label: 'In what ways are you acting in alignment with "becoming her?"' },
  { id: 'proud', label: 'What are you proud of yourself for today?' },
  { id: 'goals', label: 'What goals / intentions do you have for tomorrow?' },
]

function isoDaysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

// The three example days you gave, told in order: a lovely day, an adventurous
// day, then a hard one, filed as 3, 2, and 1 day(s) ago.
export const SEED_ENTRIES: Entry[] = [
  {
    id: 'e-3',
    date: isoDaysAgo(3),
    summary: 'I had a lovely picnic with my friends at Kate Sessions Park.',
    iconId: 'picnic',
    mode: 'free',
    freeText: 'I had a lovely picnic with my friends at Kate Sessions Park.',
    public: true,
  },
  {
    id: 'e-2',
    date: isoDaysAgo(2),
    summary: 'I went lobster diving in the cove.',
    iconId: 'lobsterDive',
    mode: 'free',
    freeText: 'I went lobster diving in the cove.',
  },
  {
    id: 'e-1',
    date: isoDaysAgo(1),
    summary: 'I cried myself to sleep and ate a bunch of ice cream.',
    iconId: 'cryIceCream',
    mode: 'free',
    freeText: 'I cried myself to sleep and ate a bunch of ice cream.',
  },
]

const FILLER_ICONS = ['sun', 'coffee', 'book', 'heart', 'mountain', 'rain', 'confetti', 'campfire', 'waves'] as const

const FILLER_SUMMARIES = [
  'Quiet morning, good coffee, slow start.',
  'Finished the book I have been putting off.',
  'Called my mom, longer than we planned.',
  'Hiked further than I meant to and loved it.',
  'Rained all day, stayed in, felt cozy.',
  "A friend's birthday, good cake, better company.",
  'Campfire with the roommates, talked for hours.',
  'Long swim, clear head after.',
  'Ordinary Tuesday, nothing remarkable, and that was fine.',
]

// A handful of full guided-template days, mixed into the history below so
// the Archive page's "Templates" filter has real entries to show.
const GUIDED_SEED: Array<{ dayOffset: number; summary: string; iconId: Entry['iconId']; answers: Record<string, string> }> = [
  {
    dayOffset: 6,
    summary: 'Grateful for a slow morning and a clear answer to something I had been praying about.',
    iconId: 'sun',
    answers: {
      gratitude: 'Coffee on the porch, a text from an old friend, a walk with no destination.',
      god: 'Felt a quiet nudge to reach out to someone I had been avoiding, and it went better than I expected.',
      scripture: 'Psalm 46:10, "Be still and know that I am God."',
      lookingForward: 'A weekend trip that has been on the calendar for a month.',
      becomingHer: 'Choosing rest instead of scrolling, on purpose.',
      proud: 'I finally sent the email I had been putting off for a week.',
      goals: 'Meal prep on Sunday so weekday mornings feel less rushed.',
    },
  },
  {
    dayOffset: 13,
    summary: 'A tender day, mostly spent reflecting on where I have grown this year.',
    iconId: 'book',
    answers: {
      gratitude: 'My roommate, a good night of sleep, and a warm meal I did not have to cook.',
      god: 'Reminded that seasons of waiting are not seasons of being forgotten.',
      scripture: 'Philippians 4:6-7, sat with it longer than usual.',
      lookingForward: 'Seeing my sister next month.',
      becomingHer: 'Speaking to myself the way I would speak to a friend.',
      proud: 'Set a boundary I have been avoiding for months.',
      goals: 'Go to bed before midnight, actually.',
    },
  },
  {
    dayOffset: 27,
    summary: 'Busy week, but a good reminder of who is actually in charge of my calendar.',
    iconId: 'coffee',
    answers: {
      gratitude: 'A coworker covering for me, an unexpected refund, a good cup of coffee.',
      god: 'Felt peace about a decision I had been overthinking for weeks.',
      scripture: 'Proverbs 3:5-6.',
      lookingForward: 'A quiet weekend with no plans.',
      becomingHer: 'Asking for help instead of white-knuckling through it alone.',
      proud: 'Stayed calm during a hard conversation instead of shutting down.',
      goals: 'Block off time to actually rest, not just catch up on chores.',
    },
  },
]

// Backfill a modest history so the collection wall doesn't look empty,
// leaving the 3 seeded example days as the most recent entries.
export function buildYearEntries(): Entry[] {
  const entries: Entry[] = [...SEED_ENTRIES]
  const guidedByOffset = new Map(GUIDED_SEED.map((g) => [g.dayOffset, g]))
  const historyDays = 46
  for (let i = 4; i < historyDays; i++) {
    const guided = guidedByOffset.get(i)
    if (guided) {
      entries.push({
        id: `e-${i}`,
        date: isoDaysAgo(i),
        summary: guided.summary,
        iconId: guided.iconId,
        mode: 'guided',
        answers: guided.answers,
      })
      continue
    }
    if (Math.random() < 0.22) continue // some skipped days, like real life
    const icon = FILLER_ICONS[i % FILLER_ICONS.length]
    const summary = FILLER_SUMMARIES[i % FILLER_SUMMARIES.length]
    entries.push({
      id: `e-${i}`,
      date: isoDaysAgo(i),
      summary,
      iconId: icon,
      mode: 'free',
      freeText: summary,
    })
  }
  return entries
}

export const CIRCLES: Circle[] = [
  {
    id: 'c-sunday-supper',
    name: 'Sunday Supper Club',
    description: 'The girls from small group. We check in every night.',
    cover: SUNDAY_SUPPER_COVER,
    members: [
      { id: 'm-1', name: 'Maren Ito', color: 'persianRed', journalHint: 'Lots of gratitude entries this week, and a running thread about a job offer she is praying through.' },
      { id: 'm-2', name: 'Priya Nair', color: 'cabernet', journalHint: 'Reflecting on Philippians most nights, and mentions "becoming her" almost daily.' },
      { id: 'm-3', name: 'Bex Coleman', color: 'oceanWhisper', journalHint: 'Journaling through a hard breakup, with lots of proud-of-myself moments showing up lately.' },
      { id: 'm-4', name: 'Talia Fox', color: 'harvestGold', journalHint: 'Mostly short entries this month, focused on goals for a half-marathon.' },
    ],
    entries: [
      {
        id: 'ce-1',
        memberId: 'm-1',
        date: isoDaysAgo(1),
        summary: 'Said yes to the offer, scared and thrilled.',
        iconId: 'confetti',
        fullText:
          'I said yes today. My hands were actually shaking when I hit send on the email. It is not the safe choice, it is the one that scares me a little, which I am starting to think is exactly how I will know it matters. Called my mom right after and cried for a completely different reason than I expected to. Grateful does not feel like a big enough word for today.',
      },
      {
        id: 'ce-2',
        memberId: 'm-2',
        date: isoDaysAgo(1),
        summary: 'Sat with Philippians 4 for an hour, needed it.',
        iconId: 'book',
        fullText:
          'Did not plan on staying in this chapter as long as I did, but "do not be anxious about anything" kept pulling me back in. I think I have read past that verse a hundred times without letting it actually land. Today it landed. Writing down what I am anxious about, one by one, and handing each one over feels small but it is not nothing.',
      },
      { id: 'ce-3', memberId: 'm-3', date: isoDaysAgo(2), summary: 'First good night of sleep in weeks.', iconId: 'sun' },
      { id: 'ce-4', memberId: 'm-4', date: isoDaysAgo(2), summary: '14 miles today, legs are done.', iconId: 'mountain' },
      { id: 'ce-5', memberId: 'm-1', date: isoDaysAgo(3), summary: 'Rainy day, read on the couch all afternoon.', iconId: 'rain' },
      { id: 'ce-6', memberId: 'm-3', date: isoDaysAgo(3), summary: 'Called my sister, cried a little, felt lighter.', iconId: 'heart' },
      { id: 'ce-7', memberId: 'm-2', date: isoDaysAgo(4), summary: 'Coffee with a stranger turned into a real conversation.', iconId: 'coffee' },
      { id: 'ce-8', memberId: 'm-4', date: isoDaysAgo(4), summary: 'Bonfire on the beach with the whole crew.', iconId: 'campfire' },
      { id: 'ce-9', memberId: 'm-1', date: isoDaysAgo(5), summary: 'Ocean swim before work, best decision.', iconId: 'waves' },
    ],
  },
  {
    id: 'c-college-house',
    name: 'The Old House',
    description: 'Roommates from college, scattered across three time zones now.',
    cover: OLD_HOUSE_COVER,
    members: [
      { id: 'm-5', name: 'Diego Cruz', color: 'sproutingSage', journalHint: 'Journaling almost entirely about the new apartment and settling into the city.' },
      { id: 'm-6', name: 'Noor Haddad', color: 'oceanWhisper', journalHint: 'Deep in a Scripture read-through plan, referencing Psalms a lot this month.' },
      { id: 'm-7', name: 'Sam Whitfield', color: 'oliveShadow', journalHint: 'Short, funny one-liners most days, seems to be in a lighter season.' },
    ],
    entries: [
      { id: 'ce-10', memberId: 'm-5', date: isoDaysAgo(1), summary: 'Finally found a couch, apartment feels real now.', iconId: 'sun' },
      {
        id: 'ce-11',
        memberId: 'm-6',
        date: isoDaysAgo(1),
        summary: 'Psalm 23 again, always lands different.',
        iconId: 'book',
        fullText:
          'Read Psalm 23 for probably the thousandth time in my life and it still got me at "he restores my soul." I think I needed reminding that rest is something being done for me, not something I have to earn by finishing everything on my list first. Sat with my coffee a little longer than I meant to this morning. No regrets.',
      },
      { id: 'ce-12', memberId: 'm-7', date: isoDaysAgo(2), summary: 'Made pasta from scratch, absolute chaos, worth it.', iconId: 'confetti' },
      { id: 'ce-13', memberId: 'm-5', date: isoDaysAgo(3), summary: 'Missed everyone tonight, texted the group at 1am.', iconId: 'heart' },
      { id: 'ce-14', memberId: 'm-6', date: isoDaysAgo(4), summary: 'Slow rainy Sunday, tea and journaling.', iconId: 'rain' },
      { id: 'ce-15', memberId: 'm-7', date: isoDaysAgo(5), summary: 'Beat my 5k PR by accident.', iconId: 'mountain' },
    ],
  },
  {
    id: 'c-sydney-eldon',
    name: 'Sydney and Eldon',
    description: 'Just the two of us, checking in daily. Circles work even with one other person.',
    cover: 'goldenSand',
    members: [
      { id: 'm-8', name: 'Eldon Park', color: 'goldenSand', journalHint: 'Writing mostly about grad school applications and what comes after.' },
    ],
    entries: [
      {
        id: 'ce-16',
        memberId: 'm-8',
        date: isoDaysAgo(1),
        summary: 'Finished my personal statement draft, finally.',
        iconId: 'book',
        fullText:
          'Six drafts later and I think this one actually sounds like me instead of who I think they want me to be. Sent it to you before anyone else, which felt like the right call.',
      },
      { id: 'ce-17', memberId: 'm-8', date: isoDaysAgo(3), summary: 'Long call with you tonight, needed that more than I realized.', iconId: 'heart' },
    ],
  },
]

export const INSPIRATION_TODAY = {
  scripture: {
    reference: 'Lamentations 3:22–23',
    verse: 'Because of the Lord’s great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.',
  },
  article: {
    title: 'The Practice of Noticing',
    source: 'On Being',
    blurb: 'A short read on why paying attention is itself a spiritual discipline.',
  },
  featuredEntry: {
    author: 'Priya N.',
    summary: 'Sat with Philippians 4 for an hour, needed it.',
    iconId: 'book' as const,
  },
  music: {
    title: 'Goodness of God',
    artist: 'Bethel Music',
  },
  media: {
    title: 'A short film on rest',
    kind: 'Video · 6 min',
  },
}

export const LOOKBACK_OFFSETS = [30, 60, 90, 120, 180, 365]

export const PUBLIC_FEED = [
  {
    id: 'p-1',
    name: 'J. Alvarez',
    color: 'oceanWhisper',
    summary: 'First sunrise hike of the year, worth the early alarm.',
    iconId: 'mountain' as const,
    date: isoDaysAgo(1),
    fullText:
      'Set an alarm for 5:15am, which past me would have found unthinkable. Worth every minute of lost sleep. There is a specific kind of quiet at the top of a trail before anyone else has gotten there, like the whole day is still unclaimed. Already planning to make this a regular thing, we will see if that survives contact with next week.',
  },
  { id: 'p-2', name: 'R. Okafor', color: 'harvestGold', summary: 'Taught my niece to ride a bike today.', iconId: 'confetti' as const, date: isoDaysAgo(1) },
  { id: 'p-3', name: 'M. Lindqvist', color: 'sproutingSage', summary: 'Quiet studio day, finished a painting I almost gave up on.', iconId: 'sun' as const, date: isoDaysAgo(2) },
  { id: 'p-4', name: 'A. Chen', color: 'cabernet', summary: 'Hard day at the hospital, grateful for coffee and coworkers.', iconId: 'coffee' as const, date: isoDaysAgo(2) },
  { id: 'p-5', name: 'D. Osei', color: 'persianRed', summary: 'Rain on the tin roof all night, best sleep in weeks.', iconId: 'rain' as const, date: isoDaysAgo(3) },
  {
    id: 'p-6',
    name: 'K. Petrova',
    color: 'oliveShadow',
    summary: 'Reread an old journal entry from a year ago and cried, in a good way.',
    iconId: 'heart' as const,
    date: isoDaysAgo(3),
    fullText:
      'Went looking for a phone number in my notes app and fell into an entry from almost exactly a year ago instead. I was so sure back then that I would still be stuck in the same place. I am not. Not all the way through whatever this is, but not where I was either. Wanted to write this down so future me has proof, the way past me just gave it to present me.',
  },
  { id: 'p-7', name: 'S. Kimura', color: 'morningTide', summary: 'Bonfire on the last night of the trip, nobody wanted to leave.', iconId: 'campfire' as const, date: isoDaysAgo(4) },
  { id: 'p-8', name: 'L. Novak', color: 'satinGold', summary: 'Cold plunge at 6am, felt alive the rest of the day.', iconId: 'waves' as const, date: isoDaysAgo(4) },
  { id: 'p-9', name: 'T. Mensah', color: 'goldenSand', summary: 'Read Ecclesiastes on the porch, needed the perspective.', iconId: 'book' as const, date: isoDaysAgo(5) },
]

// Short lines for the daily envelope card, in the voice of a quiet reminder
// rather than a citation.
export const DAILY_QUOTES = [
  'Let the next person who comes into your life meet you already at peace.',
  'Slowness is not falling behind. It is arriving on purpose.',
  'You are allowed to outgrow a version of yourself you once loved.',
  'Today does not have to be productive to be worth keeping.',
  'The quiet days count too. Write them down anyway.',
  'Whatever today held, it is already becoming a story you get to keep.',
  'Some days ask to be survived. Others ask to be savored. Both deserve a page.',
  'You are closer to who you are becoming than you think.',
  'Let today be small. Small is still yours.',
  'Notice one good thing before you close this. That counts as gratitude.',
  'The season you are in has a shape you will only see later. Trust it.',
  'Rest is not the opposite of growth. Sometimes it is the whole point.',
]
