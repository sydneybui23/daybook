import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { StoreProvider, useStore } from './lib/store'
import { Header } from './components/Header'
import { BottomNav } from './components/BottomNav'
import { Dashboard } from './pages/Dashboard'
import { Archive } from './pages/Archive'
import { Circles } from './pages/Circles'
import { CircleDetail } from './pages/CircleDetail'
import { Social } from './pages/Social'
import { LookBack } from './pages/LookBack'
import { FullBloom } from './pages/FullBloom'
import { Profile } from './pages/Profile'
import { InviteLanding } from './pages/InviteLanding'
import { Onboarding } from './pages/Onboarding'
import { Terms } from './pages/Terms'
import { PersonProfile } from './pages/PersonProfile'
import { Moderation } from './pages/Moderation'
import { SocialRestricted } from './pages/SocialRestricted'

function AppShell() {
  const { profile } = useStore()

  if (!profile.onboarded) {
    return <Onboarding />
  }

  return (
    <BrowserRouter>
      <Header />
      <div className="lg:pl-60 lg:pt-[170px]">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/circles" element={<Circles />} />
          <Route path="/circles/:id" element={<CircleDetail />} />
          <Route path="/social" element={profile.blockedFromSocial ? <SocialRestricted /> : <Social />} />
          <Route path="/lookback" element={<LookBack />} />
          <Route path="/full-bloom" element={<FullBloom />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/invite/:id" element={<InviteLanding />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/people/:name" element={<PersonProfile />} />
          <Route path="/moderation" element={<Moderation />} />
        </Routes>
      </div>
      <BottomNav />
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <AppShell />
    </StoreProvider>
  )
}
