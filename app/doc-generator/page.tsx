'use client'

import dynamic from 'next/dynamic'

const DocGeneratorPage = dynamic(
  () => import('@/components/DocGeneratorPage'),
  { ssr: false }
)

export default function Page() {
  return <DocGeneratorPage />
} 