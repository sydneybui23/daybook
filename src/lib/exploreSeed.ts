import type { PostEntry } from '../components/PostCard'

function isoDaysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

// A handful of thoughtful, essay-length posts to seed the Explore tab so it
// doesn't launch empty. These are original writing, not real users — meant
// to set the tone (reflective, substantive) for what gets shared publicly.
export const EXPLORE_SEED: PostEntry[] = [
  {
    id: 'seed-1',
    name: 'Maren Okoye',
    color: 'oliveShadow',
    iconId: 'rain',
    photo: '/photos/dog-walk-bw.jpg',
    date: isoDaysAgo(1),
    summary: 'Six weeks out, and the walks are still where it catches me.',
    fullText:
      "Six weeks out, and the walks are still where it catches me. Not the mornings, not the empty side of the bed, not even the anniversaries I braced for. It's the walking. Something about the rhythm of it, the fact that my body knows how to do this without my permission, leaves too much room for my mind to wander somewhere I didn't ask it to go.\n\nI used to think grief would announce itself. That it would look like the movies, a single collapse, a clean before and after. Instead it's this: a field, a dog who doesn't know anything is different, and me, catching myself mid-thought about something I wanted to tell someone who isn't there to tell anymore.\n\nWhat I'm learning, slowly, is that the walking is the point, not the interruption. I'm not trying to get somewhere. I'm just letting my body keep proving to me that it still knows how to move forward, one ordinary field at a time, even when the rest of me isn't sure it does.",
  },
  {
    id: 'seed-2',
    name: 'Theo Lindqvist',
    color: 'oceanWhisper',
    iconId: 'waves',
    photo: '/photos/coastal-cliffs.jpg',
    date: isoDaysAgo(1),
    summary: "I quit without a plan, and I'm trying to sit with that instead of fixing it.",
    fullText:
      "I quit without a plan, and I'm trying to sit with that instead of immediately fixing it. Everyone in my life has a theory about what I should do next, and I understand why. Uncertainty makes people around you uncomfortable almost faster than it makes you uncomfortable yourself. But I've noticed that every time I reach for a plan just to have one, it's not clarity I'm chasing, it's relief from the discomfort of not knowing.\n\nStanding at the edge of something today, actually at the edge of something, cliffs and all, it occurred to me that the not-knowing isn't the emergency I've been treating it as. I have savings. I have time. What I don't have is practice sitting in open space without immediately building a structure in it.\n\nSo that's the actual work right now, I think. Not finding the next thing. Learning to let a question stay a question for longer than feels comfortable, and trusting that an answer built on patience will hold better than one built on panic.",
  },
  {
    id: 'seed-3',
    name: 'Priya Anand',
    color: 'persianRed',
    iconId: 'heart',
    photo: '/photos/grandma-granddaughter.jpg',
    date: isoDaysAgo(2),
    summary: 'My grandmother forgot my name today and then told me a story I had never heard.',
    fullText:
      "My grandmother forgot my name today, and then, twenty minutes later, told me a story about her own mother I had never once heard in twenty-nine years of visits. That's the shape grief takes now, before the actual loss even arrives: gain and loss arriving in the same conversation, sometimes the same sentence.\n\nI used to think memory was the whole person, and that losing it meant losing them by degrees. I'm starting to think that's not quite right. She is still funny. She still hums the same three bars of the same song while she waits for tea to steep. The specific facts are leaving, but whatever it is underneath the facts, the actual texture of a person, is still entirely, unmistakably her.\n\nI'm trying to let go of needing her to remember me correctly, and instead just be someone kind sitting across from her, whoever she currently believes I am. It turns out that's its own kind of intimacy. Maybe a truer one than I expected.",
  },
  {
    id: 'seed-4',
    name: 'Callum Reyes',
    color: 'harvestGold',
    iconId: 'mountain',
    photo: '/photos/hiker-mountain.jpg',
    date: isoDaysAgo(3),
    summary: 'I hiked the trail he never got to finish, and I understand why he loved it now.',
    fullText:
      "He talked about this trail for two years and never got the chance to hike it. So I did it for him, or with him, or some version of both that I don't have clean language for yet. Grief makes you do strange, specific things, and apparently mine wanted altitude.\n\nAbout four hours in, legs shaking, well past the point where I'd normally have turned around, I understood something I don't think I could have understood any other way: why he loved this so much wasn't really about the summit. It was about the specific kind of thinking that only shows up when your body is working too hard for your mind to perform for anyone. No audience, no version of yourself to manage. Just the next step.\n\nI didn't feel him at the top, the way I half-hoped I might. I felt something quieter and maybe more honest, which is that I finally understood a piece of him I only knew secondhand. That feels like its own kind of visit.",
  },
  {
    id: 'seed-5',
    name: 'Naomi Fischer',
    color: 'satinGold',
    iconId: 'coffee',
    photo: '/photos/paris-sidewalk-cafe.jpg',
    date: isoDaysAgo(4),
    summary: 'Three days into traveling alone, and I finally stopped performing for an imaginary audience.',
    fullText:
      "Three days into traveling by myself and I noticed something shift today, sitting at a table clearly built for two, ordering in my terrible second-language French. For the first two days I caught myself narrating my own trip in my head, like I was building a story to tell someone later. Today I just sat there. No narration. No imaginary audience.\n\nIt's a small thing to write down, but it didn't feel small. I think I've spent more of my life performing my own experiences for other people, even in absentia, than I've spent actually having them. Alone, with no one to report back to in real time, there was nothing to do except actually be there.\n\nI ordered a second coffee I didn't need, just to stay a little longer in the version of myself that wasn't managing anyone's impression of her, including my own.",
  },
  {
    id: 'seed-6',
    name: 'Elias Whitfield',
    color: 'morningTide',
    iconId: 'book',
    photo: '/photos/horses-water.jpg',
    date: isoDaysAgo(5),
    summary: 'The horses did not care that I was early for once, and that undid me a little.',
    fullText:
      "I got to the water early for once in my life, ahead of the horses, ahead of the noise in my own head that usually shows up before I do. They didn't care that I was early. They didn't care about the version of the morning I'd rehearsed on the drive over, the one where I'd use the quiet to think through the thing I've been avoiding thinking through.\n\nThey just kept doing what they were doing, unbothered, entirely present, and it undid something in me I didn't expect. I've been treating stillness like a tool, something I schedule in order to produce an insight, a decision, a breakthrough. Watching them, it occurred to me that stillness that's waiting to be useful isn't actually stillness at all.\n\nSo I sat down in the grass and didn't think about the thing. I just watched the water move and let the morning be exactly as unproductive as it wanted to be. It turns out that was the thing I needed anyway.",
  },
]
