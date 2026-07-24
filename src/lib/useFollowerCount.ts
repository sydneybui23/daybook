import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from './firebase'

// Live follower count for a given uid. Returns null while unknown/unavailable
// (e.g. no real uid yet, such as for the seed/demo Explore posts).
export function useFollowerCount(targetUid: string | undefined): number | null {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    if (!targetUid || !db) {
      setCount(null)
      return
    }
    const q = query(collection(db, 'follows'), where('followingUid', '==', targetUid))
    return onSnapshot(
      q,
      (snap) => setCount(snap.size),
      () => setCount(null),
    )
  }, [targetUid])

  return count
}
