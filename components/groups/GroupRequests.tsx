'use client'

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Check, X, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { enUS } from 'date-fns/locale'
import type { GroupJoinRequest } from '@/types'

interface GroupRequestsProps {
  groupId: string
  onRequestProcessed: () => void
}

export function GroupRequests({ groupId, onRequestProcessed }: GroupRequestsProps) {
  const [requests, setRequests] = useState<GroupJoinRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [groupId])

  const fetchRequests = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/groups/${groupId}/requests`)
      const data = await response.json()

      if (response.ok) {
        setRequests(data.requests || [])
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRespond = async (requestId: string, action: 'approve' | 'reject') => {
    setProcessingId(requestId)
    try {
      const response = await fetch(`/api/groups/${groupId}/requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Operation failed')
      }

      toast.success(action === 'approve' ? 'Application approved' : 'Application rejected')
      setRequests(prev => prev.filter(r => r.id !== requestId))
      onRequestProcessed()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Operation failed')
    } finally {
      setProcessingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No pending applications</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div
          key={request.id}
          className="flex items-center justify-between p-4 border rounded-lg bg-card"
        >
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={request.user?.avatar_url || undefined} />
              <AvatarFallback>
                {request.user?.username?.[0] || request.user?.full_name?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">
                {request.user?.username || request.user?.full_name || 'User'}
              </div>
              {request.message && (
                <p className="text-sm text-muted-foreground mt-1">{request.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Applied {formatDistanceToNow(new Date(request.created_at), { addSuffix: true, locale: enUS })}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRespond(request.id, 'reject')}
              disabled={processingId === request.id}
            >
              {processingId === request.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <X className="w-4 h-4" />
              )}
            </Button>
            <Button
              size="sm"
              onClick={() => handleRespond(request.id, 'approve')}
              disabled={processingId === request.id}
            >
              {processingId === request.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
