'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Upload, X, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface CreatePostFormProps {
  file: File | null
  setFile: (file: File | null) => void
  preview: string | null
  setPreview: (preview: string | null) => void
  onClose: () => void
}

export function CreatePostForm({ file, setFile, preview, setPreview, onClose }: CreatePostFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    if (file) {
      const objectUrl = URL.createObjectURL(file)
      setPreview(objectUrl)
      return () => URL.revokeObjectURL(objectUrl)
    }
  }, [file, setPreview])

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) return

    // Validate file type
    if (!selectedFile.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please select an image file',
        variant: 'destructive',
      })
      return
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 10MB',
        variant: 'destructive',
      })
      return
    }

    setFile(selectedFile)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = () => {
    setDragActive(false)
  }

  const handleRemoveFile = () => {
    setFile(null)
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      toast({
        title: 'No image selected',
        description: 'Please select an image to post',
        variant: 'destructive',
      })
      return
    }

    setUploading(true)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Upload image to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(fileName)

      // Create post in database
      const { error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          image_url: publicUrl,
          caption: caption.trim() || null,
        })

      if (postError) throw postError

      toast({
        title: 'Post created!',
        description: 'Your post has been shared successfully',
      })

      onClose()
      router.refresh()
      router.push('/')
    } catch (error) {
      console.error('Error creating post:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create post',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!preview ? (
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
            dragActive ? 'border-[hsl(var(--primary))] bg-[hsl(var(--muted))]' : 'border-muted-foreground/25'
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            className="hidden"
            id="post-image"
          />
          <Label htmlFor="post-image" className="cursor-pointer">
            <div className="space-y-2">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, GIF up to 10MB
                </p>
              </div>
            </div>
          </Label>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
            {preview && (
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            )}
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={handleRemoveFile}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              placeholder="Write a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={2200}
              rows={3}
              disabled={uploading}
            />
            <p className="text-xs text-muted-foreground text-right">
              {caption.length}/2200
            </p>
          </div>

          <Button
            type="submit"
            className="w-full bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary) / 80%)] text-[hsl(var(--background))]"
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Posting…
              </>
            ) : (
              'Share Post'
            )}
          </Button>
        </div>
      )}
    </form>
  )
}
