'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, Calendar, MapPin, Lock, Globe, Settings, UserMinus, Shield, LogOut, UserPlus, Link as LinkIcon, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import type { Group, GroupMember } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { GroupItinerary } from './GroupItinerary'
import { ExpenseList } from './ExpenseList'
import { InviteLinkManager } from './InviteLinkManager'
import { JoinRequestDialog } from './JoinRequestDialog'
import { GroupRequests } from './GroupRequests'
import { GroupLocationMap } from './GroupLocationMap'
import { GroupSidebarNavigation } from './GroupSidebarNavigation'

interface GroupDetailProps {
  group: Group
  currentUserId?: string
}

export function GroupDetail({ group, currentUserId }: GroupDetailProps) {
  const router = useRouter()
  const [isMember, setIsMember] = useState(group.is_member || false)
  const [userRole, setUserRole] = useState(group.current_user_role || 'member')
  const [isLoading, setIsLoading] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [selectedTab, setSelectedTab] = useState('members')

  const isLeader = group.leader_id === currentUserId
  const isAdmin = userRole === 'admin' || isLeader
  const [showRequestDialog, setShowRequestDialog] = useState(false)
  const [refreshRequests, setRefreshRequests] = useState(0)
  const [membersWithLocations, setMembersWithLocations] = useState<GroupMember[]>(group.members || [])

  // Fetch members with location data when user is a member
  useEffect(() => {
    console.log('GroupDetail: isMember changed:', isMember, 'group.id:', group.id)
    if (isMember) {
      fetchMembersWithLocations()
    }
  }, [isMember, group.id])

  const fetchMembersWithLocations = async () => {
    console.log('Fetching members with locations for group:', group.id)
    try {
      const response = await fetch(`/api/groups/${group.id}/members/location`)
      console.log('Response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Members with locations data:', data)
        setMembersWithLocations(data.members || [])
      } else {
        const errorData = await response.json()
        console.error('Error fetching members:', errorData)
      }
    } catch (error) {
      console.error('Error fetching member locations:', error)
    }
  }

  const handleJoin = async () => {
    if (!currentUserId) {
      toast.error('Please sign in first')
      return
    }

    if (group.join_type === 'open') {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/groups/${group.id}/join`, {
          method: 'POST',
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to join group')
        }

        toast.success('Successfully joined the group!')
        setIsMember(true)
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to join group')
      } finally {
        setIsLoading(false)
      }
    } else if (group.join_type === 'request') {
      setShowRequestDialog(true)
    }
  }

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this group?')) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/groups/${group.id}/leave`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to leave group')
      }

      toast.success('Left the group')
      setIsMember(false)
      router.push('/groups')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to leave group')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveMember = async (member: GroupMember) => {
    if (!confirm(`Are you sure you want to remove ${member.user?.username || member.user?.full_name || 'this member'}?`)) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/groups/${group.id}/members/${member.user_id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to remove member')
      }

      toast.success('Member removed')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove member')
    } finally {
      setIsLoading(false)
    }
  }

  const activityColor = group.activity_type === 'hiking'
    ? 'bg-green-100 text-green-700'
    : 'bg-orange-100 text-orange-700'

  const activityLabel = group.activity_type === 'hiking' ? 'Hiking' : 'Mountain Climbing'

  return (
    <div className="min-h-screen">
      {/* Desktop Sidebar - Fixed position */}
      <div className="hidden md:block">
        <GroupSidebarNavigation
          selectedTab={selectedTab}
          onTabChange={setSelectedTab}
          onInviteClick={() => setShowInviteDialog(true)}
          isMember={isMember}
          isLeader={isLeader}
        />
      </div>

      {/* Main Content - With left margin on desktop */}
      <div className="md:ml-16 space-y-6 pb-24 md:pb-6">
        {/* Mobile Navigation Trigger */}
        <div className="md:hidden">
          <GroupSidebarNavigation
            selectedTab={selectedTab}
            onTabChange={setSelectedTab}
            onInviteClick={() => setShowInviteDialog(true)}
            isMember={isMember}
            isLeader={isLeader}
          />
        </div>

        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.location.href = '/'}
          className="mb-2"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>

        {/* Header */}
        <div className="relative">
          {/* Mobile: Cover image height 192px (h-48) */}
          {group.cover_photo_url && (
            <div className="relative h-48 md:h-64 lg:h-80 w-full overflow-hidden rounded-lg">
              <img
                src={group.cover_photo_url}
                alt={group.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          )}

          <div className="mt-4 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-start gap-3">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">{group.name}</h1>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge className={activityColor}>{activityLabel}</Badge>
                    <Badge variant={group.is_public ? 'default' : 'secondary'}>
                      {group.is_public ? <Globe className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
                      {group.is_public ? 'Public' : 'Private'}
                    </Badge>
                  </div>
                </div>
              </div>

              {group.description && (
                <p className="text-muted-foreground mt-2">{group.description}</p>
              )}

              <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(group.start_date).toLocaleDateString('en-US')}</span>
                  {group.end_date && (
                    <span> - {new Date(group.end_date).toLocaleDateString('en-US')}</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{group.members_count}/{group.max_members} members</span>
                </div>
              </div>
            </div>

            {/* Mobile: Full width buttons with h-12 */}
            <div className="flex flex-col sm:flex-row gap-2">
              {!isMember ? (
                <Button onClick={handleJoin} disabled={isLoading} className="h-12 w-full sm:w-auto">
                  <UserPlus className="w-5 h-5 mr-2" />
                  {group.join_type === 'open' ? 'Join Group' : 'Request to Join'}
                </Button>
              ) : (
                <>
                  {isLeader && (
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/groups/${group.id}/edit`)}
                      className="h-12 w-full sm:w-auto"
                    >
                      <Settings className="w-5 h-5 mr-2" />
                      Settings
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    onClick={handleLeave}
                    disabled={isLoading}
                    className="h-12 w-full sm:w-auto"
                  >
                    <LogOut className="w-5 h-5 mr-2" />
                    Leave Group
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content - Conditional rendering instead of Tabs */}
        {selectedTab === 'members' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Group Members ({group.members?.length || 0})</CardTitle>
                {isLeader && (
                  <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                    <DialogTrigger
                      render={
                        <Button variant="outline" size="sm">
                          <LinkIcon className="w-4 h-4 mr-1" />
                          Invite Members
                        </Button>
                      }
                    />
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Invite Link Management</DialogTitle>
                      </DialogHeader>
                      <InviteLinkManager
                        groupId={group.id}
                        onClose={() => setShowInviteDialog(false)}
                      />
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {group.members?.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 min-h-[56px]"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={member.user?.avatar_url || undefined} />
                        <AvatarFallback className="text-sm">
                          {member.user?.username?.[0] || member.user?.full_name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-base truncate flex items-center flex-wrap gap-2">
                          <span>{member.user?.username || member.user?.full_name || 'User'}</span>
                          {member.role === 'leader' && (
                            <Badge variant="default" className="ml-0 text-xs">Leader</Badge>
                          )}
                          {member.role === 'admin' && (
                            <Badge variant="secondary" className="text-xs"><Shield className="w-3 h-3 mr-1" />Admin</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          Joined {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true, locale: enUS })}
                        </div>
                      </div>
                    </div>

                    {isLeader && member.user_id !== currentUserId && member.role !== 'leader' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11 shrink-0"
                        onClick={() => {
                          if (confirm(`Are you sure you want to remove ${member.user?.username || member.user?.full_name || 'this member'}?`)) {
                            handleRemoveMember(member)
                          }
                        }}
                        disabled={isLoading}
                      >
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {selectedTab === 'location' && isMember && (
          <GroupLocationMap
            groupId={group.id}
            members={membersWithLocations}
            currentUserId={currentUserId}
          />
        )}

        {selectedTab === 'itinerary' && (
          <GroupItinerary
            groupId={group.id}
            isLeader={isLeader}
            initialItinerary={group.shared_itinerary}
          />
        )}

        {selectedTab === 'requests' && isLeader && (
          <Card>
            <CardHeader>
              <CardTitle>Join Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <GroupRequests
                groupId={group.id}
                onRequestProcessed={() => {
                  setRefreshRequests(prev => prev + 1)
                  router.refresh()
                }}
                key={refreshRequests}
              />
            </CardContent>
          </Card>
        )}

        {selectedTab === 'expenses' && isMember && (
          <ExpenseList
            groupId={group.id}
            currentUserId={currentUserId}
            isLeader={isLeader}
          />
        )}

        <JoinRequestDialog
          open={showRequestDialog}
          onOpenChange={setShowRequestDialog}
          groupId={group.id}
          groupName={group.name}
          groupDescription={group.description}
        />
      </div>
    </div>
  )
}
