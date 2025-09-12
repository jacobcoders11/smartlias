'use client'

import PageLoading from '../components/common/PageLoading'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PageLoading from '../components/common/PageLoading'
import ApiClient from '../lib/apiClient'
import { ROLE_TYPES } from '@shared/constants'

export default function IndexPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to homepage immediately
    router.push('/home')
  }, [router])

  return <PageLoading/>
}
