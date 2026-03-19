'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search as SearchIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import { createFollowNotification } from '@/lib/notifications'

interface SearchResult {
  id: string
  username: string
  full_name?: string
  avatar_url?: string
  followers_count?: number
  isFollowing?: boolean
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get('q') || ''
  const [searchQuery, setSearchQuery] = useState(query)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    // Get current user
    const getCurrentUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    getCurrentUser()
  }, [])

  useEffect(() => {
    const fetchResults = async () => {
      if (query.trim()) {
        setLoading(true)
        try {
          const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
          const data = await response.json()
          setResults(data)
        } catch (error) {
          console.error('Error searching:', error)
          setResults([])
        } finally {
          setLoading(false)
        }
      } else {
        setResults([])
      }
    }

    fetchResults()
  }, [query])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleFollowToggle = async (profile: SearchResult, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!currentUserId || currentUserId === profile.id) return

    const supabase = createClient()
    const newFollowingState = !profile.isFollowing

    // Optimistic update
    setResults(results.map(r =>
      r.id === profile.id
        ? { ...r, isFollowing: newFollowingState, followers_count: (r.followers_count || 0) + (newFollowingState ? 1 : -1) }
        : r
    ))

    try {
      if (newFollowingState) {
        await supabase
          .from('follows')
          .insert({
            follower_id: currentUserId,
            following_id: profile.id,
          })
        toast({
          title: 'Following',
          description: `You are now following @${profile.username}`,
        })
        await createFollowNotification(profile.id, currentUserId)
      } else {
        await supabase
          .from('follows')
          .delete()
          .match({
            follower_id: currentUserId,
            following_id: profile.id,
          })
        toast({
          title: 'Unfollowed',
          description: `You unfollowed @${profile.username}`,
        })
      }
    } catch (error) {
      // Revert on error
      setResults(results.map(r =>
        r.id === profile.id
          ? { ...r, isFollowing: profile.isFollowing, followers_count: profile.followers_count }
          : r
      ))
      toast({
        title: 'Error',
        description: 'Failed to update follow status',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Search</h1>

      {/* Search Input */}
      <form onSubmit={handleSubmit} className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search users..."
          className="w-full pl-10 pr-20 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-[#2D4A3E]"
        />
        <Button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2" size="sm">
          Search
        </Button>
      </form>

      {/* Search Results */}
      {query.trim() ? (
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Searching...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No users found for "{query}"</p>
              </div>
            ) : (
              <div className="divide-y">
                {results.map((profile) => (
                  <div
                    key={profile.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors gap-3"
                  >
                    <Link href={`/${profile.username}`} className="flex items-center space-x-3 flex-1 min-w-0">
                      <Avatar className="h-12 w-12 flex-shrink-0">
                        <AvatarImage src={profile.avatar_url || undefined} alt={profile.username || 'User'} />
                        <AvatarFallback className="bg-[#2D4A3E] text-[#FAF8F5]">
                          {profile.username?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate">{profile.username}</p>
                        {profile.full_name && (
                          <p className="text-sm text-muted-foreground truncate">{profile.full_name}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {profile.followers_count || 0} followers
                        </p>
                      </div>
                    </Link>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {currentUserId && currentUserId !== profile.id ? (
                        <Button
                          variant={profile.isFollowing ? "outline" : "default"}
                          size="sm"
                          onClick={(e) => handleFollowToggle(profile, e)}
                          className="rounded-full"
                        >
                          {profile.isFollowing ? 'Following' : 'Follow'}
                        </Button>
                      ) : (
                        <Link href={`/${profile.username}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <SearchIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Search for users by username or name
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
