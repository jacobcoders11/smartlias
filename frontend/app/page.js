'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function IndexPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to homepage immediately
    router.push('/home')
  }, [router])

  return <PageLoading/>
}
