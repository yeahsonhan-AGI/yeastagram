'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Search as SearchIcon,
  Plus,
  Heart,
  User as UserIcon,
  LogOut,
  Settings,
} from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import type { User } from '@/types'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

interface HeaderProps {
  user: User | null
  title?: string
}

export function Header({ user, title }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [unreadCount, setUnreadCount] = useState(0)
  const [prevPathname, setPrevPathname] = useState(pathname)
  const [mounted, setMounted] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // Mark when component is mounted on client
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch unread notification count
  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) {
      setUnreadCount(0)
      return
    }

    try {
      const { getUnreadNotificationCountAction } = await import('@/lib/actions/notifications')
      const count = await getUnreadNotificationCountAction()
      setUnreadCount(count)
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    }
  }, [user?.id])

  // Initial fetch and periodic polling
  useEffect(() => {
    fetchUnreadCount()

    const interval = setInterval(fetchUnreadCount, 30000) // Poll every 30 seconds

    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  // Clear badge when entering notifications page
  useEffect(() => {
    if (pathname === '/notifications' && prevPathname !== '/notifications') {
      setUnreadCount(0)
    }
    setPrevPathname(pathname)
  }, [pathname, prevPathname])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/signin')
    router.refresh()
  }

  const getPageTitle = () => {
    if (title) return title

    if (pathname === '/') return 'Home'
    if (pathname === '/explore') return 'Explore'
    if (pathname?.startsWith('/groups')) return 'Groups'
    if (pathname?.startsWith('/trips')) return 'Trips'
    if (pathname === '/notifications') return 'Notifications'
    if (pathname === '/search') return 'Search'
    if (pathname === '/create') return 'Create Post'
    if (pathname === '/settings') return 'Settings'

    // Profile pages
    if (pathname?.match(/^\/[\w.-]+$/)) return 'Profile'

    return 'Yact'
  }

  const isAuthPage = pathname?.startsWith('/auth') || pathname?.startsWith('/signin') || pathname?.startsWith('/signup')

  if (isAuthPage) {
    return null
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container flex h-14 max-w-screen-xl items-center justify-between px-4">
        {/* Left - Logo or Page Title */}
        <div className="flex items-center">
          {title || pathname !== '/' ? (
            <h1 className="text-lg font-semibold text-foreground">
              {getPageTitle()}
            </h1>
          ) : (
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-primary">
                Yact
              </span>
            </Link>
          )}
        </div>

        {/* Right - Action Icons */}
        <div className="flex items-center space-x-1">
          {/* Search */}
          <Link href="/search" className="inline-flex">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={(e) => {
                e.preventDefault()
                router.push('/search')
              }}
            >
              <SearchIcon className="h-5 w-5" strokeWidth={2} />
              <span className="sr-only">Search</span>
            </Button>
          </Link>

          {/* Notifications */}
          <div className="relative">
            <Link href="/notifications" className="inline-flex">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-9 w-9 rounded-full',
                  pathname === '/notifications' && 'bg-accent text-accent-foreground'
                )}
                onClick={(e) => {
                  e.preventDefault()
                  router.push('/notifications')
                }}
              >
                <Heart className="h-5 w-5" strokeWidth={2} />
                <span className="sr-only">Notifications</span>
              </Button>
            </Link>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>

          {/* Create */}
          <Link href="/create" className="inline-flex">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={(e) => {
                e.preventDefault()
                router.push('/create')
              }}
            >
              <Plus className="h-5 w-5" strokeWidth={2} />
              <span className="sr-only">Create</span>
            </Button>
          </Link>

          {/* User Menu - Sheet */}
          {user ? (
            <Sheet open={userMenuOpen} onOpenChange={setUserMenuOpen}>
              <SheetTrigger
                className="relative h-9 w-9 rounded-full overflow-hidden border-2 border-transparent hover:border-muted-foreground/20 hover:bg-accent transition-colors p-0 flex items-center justify-center ml-1"
              >
                <Avatar className="h-full w-full pointer-events-none">
                  <AvatarImage src={user.avatar_url || undefined} alt={user.username || 'User'} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {user.username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="sr-only">User menu</span>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[80vh]">
                {/* User info header */}
                <div className="flex items-center gap-3 pb-4 border-b">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar_url || undefined} alt={user.username || 'User'} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {user.username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-base truncate">
                      {user.username || 'User'}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {user.email}
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-2 space-y-1">
                  <Link
                    href={user.username ? `/${user.username}` : '#'}
                    onClick={(e) => {
                      if (!user.username) {
                        e.preventDefault()
                        setUserMenuOpen(false)
                        toast({
                          title: 'Profile not found',
                          description: 'Please complete your profile first',
                          variant: 'destructive',
                        })
                      } else {
                        setUserMenuOpen(false)
                      }
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-accent rounded-lg transition-colors"
                  >
                    <UserIcon className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Profile</span>
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-accent rounded-lg transition-colors"
                  >
                    <Settings className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Settings</span>
                  </Link>

                  <div className="border-t my-2 mx-4" />

                  <button
                    onClick={() => {
                      setUserMenuOpen(false)
                      handleSignOut()
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">Sign out</span>
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="ml-1"
              onClick={() => router.push('/signin')}
            >
              Sign in
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
