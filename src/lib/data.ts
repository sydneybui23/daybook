import type { HabitItem, TemplateQuestion } from './types'

export const DEFAULT_HABITS: HabitItem[] = [
  { id: 'water', label: 'Drink water' },
  { id: 'move', label: 'Move my body' },
  { id: 'read', label: 'Read something' },
  { id: 'pray', label: 'Pray / meditate' },
  { id: 'sleep', label: 'Sleep by 11pm' },
]

export const TEMPLATE_QUESTIONS: TemplateQuestion[] = [
  { id: 'gratitude', label: 'What are three great things that happened yesterday (gratitude)?' },
  { id: 'god', label: 'How is God moving in my life / where is He directing me?' },
  { id: 'scripture', label: 'What did I reflect on in Scripture today?' },
  { id: 'lookingForward', label: 'What are you looking forward to right now?' },
  { id: 'becomingHer', label: 'In what ways are you acting in alignment with "becoming her?"' },
  { id: 'proud', label: 'What are you proud of yourself for today?' },
  { id: 'goals', label: 'What goals / intentions do you have for tomorrow?' },
]

export const LOOKBACK_OFFSETS = [30, 60, 90, 120, 180, 365]

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
