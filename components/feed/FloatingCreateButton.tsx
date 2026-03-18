'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { CreatePostForm } from './CreatePostForm'
import { cn } from '@/lib/utils'

interface FloatingCreateButtonProps {
  className?: string
}

export function FloatingCreateButton({ className }: FloatingCreateButtonProps) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset state when closing
      setFile(null)
      setPreview(null)
    }
    setOpen(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            className={cn(
              'fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-lg',
              'bg-primary hover:bg-primary/90 text-primary-foreground',
              'transition-all hover:scale-105 active:scale-95',
              className
            )}
            size="icon"
          />
        }
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
        <span className="sr-only">Create Post</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create new post</DialogTitle>
          <DialogDescription>
            Share your moments with the community
          </DialogDescription>
        </DialogHeader>
        <CreatePostForm
          file={file}
          setFile={setFile}
          preview={preview}
          setPreview={setPreview}
          onClose={() => handleOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
