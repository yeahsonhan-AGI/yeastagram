'use client'

import { useState, useEffect } from 'react'
import { Copy, Link2, Plus, Trash2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import type { GroupInvite } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { enUS } from 'date-fns/locale'

interface InviteLinkManagerProps {
  groupId: string
  onClose?: () => void
}

interface CreateInviteParams {
  maxUses: number
  expiresDays: number
}

export function InviteLinkManager({ groupId, onClose }: InviteLinkManagerProps) {
  const [invites, setInvites] = useState<GroupInvite[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [createParams, setCreateParams] = useState<CreateInviteParams>({
    maxUses: 10,
    expiresDays: 7,
  })

  useEffect(() => {
    loadInvites()
  }, [groupId])

  const loadInvites = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/groups/${groupId}/invites`)
      if (!response.ok) throw new Error('Failed to load invites')

      const data = await response.json()
      setInvites(data.invites || [])
    } catch (error) {
      console.error('Error loading invites:', error)
      toast.error('Failed to load invite links')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateInvite = async () => {
    setIsCreating(true)
    try {
      const response = await fetch(`/api/groups/${groupId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createParams),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create invite link')
      }

      const data = await response.json()
      setInvites([data.invite, ...invites])
      setShowCreateForm(false)
      setCreateParams({ maxUses: 10, expiresDays: 7 })
      toast.success('Invite link created successfully')
    } catch (error) {
      console.error('Error creating invite:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create invite link')
    } finally {
      setIsCreating(false)
    }
  }

  const handleRevokeInvite = async (inviteId: string) => {
    if (!confirm('Are you sure you want to revoke this invite link?')) return

    try {
      const response = await fetch(`/api/groups/${groupId}/invites`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to revoke invite link')
      }

      setInvites(invites.map(inv =>
        inv.id === inviteId ? { ...inv, status: 'revoked' as const } : inv
      ))
      toast.success('Invite link revoked')
    } catch (error) {
      console.error('Error revoking invite:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to revoke invite link')
    }
  }

  const handleCopyLink = (invite: GroupInvite) => {
    const inviteUrl = `${window.location.origin}/groups/join?code=${invite.code}`
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopiedId(invite.id)
      toast.success('Link copied to clipboard')
      setTimeout(() => setCopiedId(null), 2000)
    }).catch(() => {
      toast.error('Copy failed')
    })
  }

  const getInviteStatusBadge = (invite: GroupInvite) => {
    if (invite.status === 'revoked') {
      return <Badge variant="secondary">Revoked</Badge>
    }
    if (invite.status === 'expired' || (invite.expires_at && new Date(invite.expires_at) < new Date())) {
      return <Badge variant="secondary">Expired</Badge>
    }
    if (invite.used_count >= invite.max_uses) {
      return <Badge variant="secondary">Used up</Badge>
    }
    return <Badge className="bg-green-100 text-green-700">Valid</Badge>
  }

  const getInviteUrl = (code: string) => {
    return `${window.location.origin}/groups/join?code=${code}`
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Invite Link Management
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? (
              <X className="w-4 h-4 mr-1" />
            ) : (
              <Plus className="w-4 h-4 mr-1" />
            )}
            {showCreateForm ? 'Cancel' : 'Create New Link'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create Form */}
        {showCreateForm && (
          <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Maximum Uses</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={createParams.maxUses}
                  onChange={(e) => setCreateParams({ ...createParams, maxUses: parseInt(e.target.value) || 10 })}
                  className="mt-1 w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Expiration (Days)</label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={createParams.expiresDays}
                  onChange={(e) => setCreateParams({ ...createParams, expiresDays: parseInt(e.target.value) || 7 })}
                  className="mt-1 w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
            <Button onClick={handleCreateInvite} disabled={isCreating} className="w-full">
              {isCreating ? 'Creating...' : 'Generate Invite Link'}
            </Button>
          </div>
        )}

        {/* Invites List */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading...
          </div>
        ) : invites.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Link2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No invite links yet</p>
            <p className="text-sm">Click the button above to create an invite link</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className={`p-4 border rounded-lg space-y-2 ${
                  invite.status === 'revoked' ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                        {invite.code}
                      </code>
                      {getInviteStatusBadge(invite)}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {getInviteUrl(invite.code)}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Usage: {invite.used_count} / {invite.max_uses}</span>
                      <span>
                        Expires:{' '}
                        {invite.expires_at
                          ? formatDistanceToNow(new Date(invite.expires_at), {
                              addSuffix: true,
                              locale: enUS,
                            })
                          : 'Never'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {invite.status === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyLink(invite)}
                      >
                        {copiedId === invite.id ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                    {invite.status === 'active' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeInvite(invite.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-muted-foreground mt-4 pt-4 border-t">
          <p>Share invite links to let others join directly. Links can be used a specified number of times and expire after a specified number of days.</p>
        </div>
      </CardContent>
    </Card>
  )
}
