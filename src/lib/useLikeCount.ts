import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from './firebase'

// Live like count for a given entry id. Returns null while unknown/unavailable
// (e.g. no real Firestore doc yet, such as for the seed/demo Explore posts).
export function useLikeCount(entryId: string | undefined): number | null {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    if (!entryId || !db) {
      setCount(null)
      return
    }
    const q = query(collection(db, 'likes'), where('entryId', '==', entryId))
    return onSnapshot(
      q,
      (snap) => setCount(snap.size),
      () => setCount(null),
    )
  }, [entryId])

  return count
}
