'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface JoinRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
  groupName: string
  groupDescription?: string | null
}

export function JoinRequestDialog({
  open,
  onOpenChange,
  groupId,
  groupName,
  groupDescription,
}: JoinRequestDialogProps) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsLoading(true)
    try {
      const response = await fetch(`/api/groups/${groupId}/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: message.trim() || undefined }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Application failed')
      }

      toast.success('Application sent, please wait for leader review')
      setMessage('')
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Application failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Apply to Join Group</DialogTitle>
          <DialogDescription>
            Send an application to the leader explaining why you want to join this group
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="mb-4">
            <h3 className="font-semibold text-lg">{groupName}</h3>
            {groupDescription && (
              <p className="text-sm text-muted-foreground mt-1">{groupDescription}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="message">Application Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Introduce yourself and explain why you want to join..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {message.length}/500
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Send Application
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
