'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { CreatePostForm } from '@/components/feed/CreatePostForm'
import { Loader2 } from 'lucide-react'

export default function CreatePage() {
  const router = useRouter()
  const supabase = createClient()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/signin')
      } else {
        setAuthenticated(true)
      }
      setLoading(false)
    }

    checkAuth()
    setMounted(true)
  }, [supabase, router])

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!authenticated) {
    return null
  }

  return (
    <div className="max-w-lg mx-auto">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold">Create new post</h1>
          <p className="text-muted-foreground">Share your moments with the world</p>
        </CardHeader>
        <CardContent>
          <CreatePostForm
            file={file}
            setFile={setFile}
            preview={preview}
            setPreview={setPreview}
            onClose={() => router.push('/')}
          />
        </CardContent>
      </Card>
    </div>
  )
}
