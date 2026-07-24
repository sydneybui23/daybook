import { Link } from 'react-router-dom'
import { HEADER_BACKGROUND } from '../lib/localPhotos'

export function Header() {
  return (
    <header
      className="relative z-40 flex h-[140px] items-end overflow-hidden sm:h-[170px] lg:fixed lg:inset-x-0 lg:top-0"
      style={{ backgroundImage: `url(${HEADER_BACKGROUND})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-black/25" />
      <Link
        to="/"
        className="relative z-10 px-6 pb-5 text-[32px] text-white"
        style={{ fontFamily: 'var(--font-quote)', fontStyle: 'italic', fontWeight: 400 }}
      >
        daybook
      </Link>
    </header>
  )
}
