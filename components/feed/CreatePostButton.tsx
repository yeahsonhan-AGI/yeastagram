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

export function CreatePostButton() {
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
      <DialogTrigger className="w-full bg-primary hover:bg-primary/90 rounded-md flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
        <Plus className="mr-2 h-4 w-4 pointer-events-none" />
        Create Post
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create new post</DialogTitle>
          <DialogDescription>
            Share your moments with the world
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
