import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { Capacitor } from '@capacitor/core'
import { FirebaseAuthentication } from '@capacitor-firebase/authentication'
import { GoogleAuthProvider, onAuthStateChanged, signInWithCredential, signInWithPopup, signOut as firebaseSignOut, type User } from 'firebase/auth'
import { auth, googleProvider, firebaseConfigured } from './firebase'

interface AuthValue {
  user: User | null
  authLoading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(firebaseConfigured)

  useEffect(() => {
    if (!auth) return
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setAuthLoading(false)
    })
  }, [])

  const signInWithGoogle = async () => {
    if (!auth) throw new Error('Firebase is not configured — missing VITE_FIREBASE_* env vars.')
    // signInWithPopup relies on a real browser popup, which doesn't exist inside the
    // native app's WebView — use the native Google Sign-In SDK there instead, then
    // hand its token to the JS SDK so `auth`/onAuthStateChanged stay in sync.
    if (Capacitor.isNativePlatform()) {
      const result = await FirebaseAuthentication.signInWithGoogle()
      const idToken = result.credential?.idToken
      if (!idToken) throw new Error("Google sign-in didn't return a credential.")
      await signInWithCredential(auth, GoogleAuthProvider.credential(idToken))
      return
    }
    await signInWithPopup(auth, googleProvider)
  }

  const signOut = async () => {
    if (!auth) return
    if (Capacitor.isNativePlatform()) {
      await FirebaseAuthentication.signOut()
    }
    await firebaseSignOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, authLoading, signInWithGoogle, signOut }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
