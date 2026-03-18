'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export function BackButton() {
  const router = useRouter()

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => router.back()}
      className="flex items-center space-x-1"
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="hidden sm:inline">返回</span>
    </Button>
  )
}
