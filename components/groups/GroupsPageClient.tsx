'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { GroupCard } from '@/components/groups/GroupCard'
import { JoinRequestDialog } from '@/components/groups/JoinRequestDialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Plus } from 'lucide-react'
import Link from 'next/link'
import type { Group, User } from '@/types'
import { useState } from 'react'
import { toast } from 'sonner'

interface GroupsPageClientProps {
  currentTab: string
  searchQuery: string
  allGroups: Group[]
  userGroups: Group[]
  user: User | null
}

export function GroupsPageClient({
  currentTab,
  searchQuery,
  allGroups,
  userGroups,
  user,
}: GroupsPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(currentTab)
  const [requestDialogOpen, setRequestDialogOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)

  // Filter groups by search query
  const filteredGroups = allGroups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Handle search form submission
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const query = formData.get('q') as string
    const params = new URLSearchParams(searchParams)
    if (query) {
      params.set('q', query)
    } else {
      params.delete('q')
    }
    router.push(`/groups?${params.toString()}`)
  }

  // Handle join button click
  const handleJoin = async (groupId: string) => {
    if (!user) {
      toast.error('Please sign in first')
      return
    }

    const group = allGroups.find(g => g.id === groupId)
    if (!group) return

    if (group.join_type === 'open') {
      // Direct join for open groups
      try {
        const response = await fetch(`/api/groups/${groupId}/join`, {
          method: 'POST',
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to join group')
        }

        toast.success('Successfully joined the group!')
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to join group')
      }
    } else if (group.join_type === 'request') {
      // Show request dialog for request-based groups
      setSelectedGroup(group)
      setRequestDialogOpen(true)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Groups</h1>
        {user && (
          <Link href="/groups/new">
            <Button size="default" className="rounded-full h-11">
              <Plus className="h-4 w-4 mr-1" />
              Create
            </Button>
          </Link>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value)
        const params = new URLSearchParams(searchParams)
        params.set('tab', value)
        router.push(`/groups?${params.toString()}`)
      }} className="w-full">
        {/* Mobile: Tab and search vertically stacked, full width */}
        <div className="flex flex-col gap-3 mb-4">
          <TabsList className="w-full h-11">
            <TabsTrigger value="discover" className="flex-1">Discover</TabsTrigger>
            {user && (
              <TabsTrigger value="my-groups" className="flex-1">My Groups</TabsTrigger>
            )}
          </TabsList>

          <form onSubmit={handleSearch} className="w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                name="q"
                placeholder="Search groups..."
                className="pl-10 h-11 rounded-full w-full"
                defaultValue={searchQuery}
              />
            </div>
          </form>
        </div>

        <TabsContent value="discover" className="mt-0">
          {filteredGroups.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGroups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  isMember={userGroups.some(ug => ug.id === group.id)}
                  onJoin={handleJoin}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery ? 'No matching groups found' : 'No public groups yet'}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-groups" className="mt-0">
          {!user ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Please sign in first</p>
            </div>
          ) : userGroups.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {userGroups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  isMember={true}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">You haven't joined any groups yet</p>
              <Link href="/groups/new">
                <Button className="rounded-full">Create a Group</Button>
              </Link>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedGroup && (
        <JoinRequestDialog
          open={requestDialogOpen}
          onOpenChange={setRequestDialogOpen}
          groupId={selectedGroup.id}
          groupName={selectedGroup.name}
          groupDescription={selectedGroup.description}
        />
      )}
    </div>
  )
}
