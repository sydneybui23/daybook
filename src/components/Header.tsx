import { Link } from 'react-router-dom'
import { DAYBOOK_LOGO_HEADER } from '../lib/localPhotos'

export function Header() {
  return (
    <header
      className="relative h-[140px] overflow-hidden bg-cover bg-center sm:h-[170px]"
      style={{ backgroundImage: `url(${DAYBOOK_LOGO_HEADER})` }}
    >
      <Link to="/" className="absolute inset-0" aria-label="daybook home" />
    </header>
  )
}
