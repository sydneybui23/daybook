import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
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
import { SignIn } from './pages/SignIn'
import { Terms } from './pages/Terms'
import { PersonProfile } from './pages/PersonProfile'
import { Moderation } from './pages/Moderation'
import { SocialRestricted } from './pages/SocialRestricted'
import { DailyHabits } from './pages/DailyHabits'
import { Travel } from './pages/Travel'

function AppShell() {
  const { profile, ready } = useStore()

  if (!ready) {
    return <div className="flex min-h-[100svh] items-center justify-center text-[13px] text-[var(--ink-soft)]">Loading your journal…</div>
  }

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
          <Route path="/habits" element={<DailyHabits />} />
          <Route path="/travel" element={<Travel />} />
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

function AppInner() {
  const { user, authLoading } = useAuth()

  if (authLoading) {
    return <div className="flex min-h-[100svh] items-center justify-center text-[13px] text-[var(--ink-soft)]">Loading…</div>
  }

  if (!user) {
    return <SignIn />
  }

  return (
    <StoreProvider>
      <AppShell />
    </StoreProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
