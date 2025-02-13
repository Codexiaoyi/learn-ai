'use client'

import dynamic from 'next/dynamic'

const DynamicPage = dynamic(
  () => import('@/components/DocGeneratorPage'),
  { ssr: false }
)

export default function ClientPage() {
  return <DynamicPage />
} 