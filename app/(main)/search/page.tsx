'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search as SearchIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get('q') || ''
  const [searchQuery, setSearchQuery] = useState(query)
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

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
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <Link href={`/${profile.username}`} className="flex items-center space-x-3 flex-1">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={profile.avatar_url || undefined} alt={profile.username || 'User'} />
                        <AvatarFallback className="bg-[#2D4A3E] text-[#FAF8F5]">
                          {profile.username?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{profile.username}</p>
                        {profile.full_name && (
                          <p className="text-sm text-muted-foreground">{profile.full_name}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {profile.followers_count || 0} followers
                        </p>
                      </div>
                    </Link>
                    <Link href={`/${profile.username}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
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
