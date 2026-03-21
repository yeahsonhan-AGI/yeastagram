'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Compass,
  Users,
  MapPin,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

interface BottomNavigationProps {
  username?: string | null
}

export function BottomNavigation({ username }: BottomNavigationProps) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const navItems = [
    {
      href: '/',
      icon: Home,
      label: 'Home',
      active: pathname === '/',
    },
    {
      href: '/explore',
      icon: Compass,
      label: 'Explore',
      active: pathname === '/explore',
    },
    {
      href: '/groups',
      icon: Users,
      label: 'Groups',
      active: pathname === '/groups' || pathname?.startsWith('/groups/'),
    },
    {
      href: '/trips',
      icon: MapPin,
      label: 'Trips',
      active: pathname === '/trips' || pathname?.startsWith('/trips/'),
    },
    {
      href: username ? `/${username}` : '/',
      icon: User,
      label: 'Profile',
      active: username && pathname?.startsWith(`/${username}`),
    },
  ]

  // Hide on specific pages
  const hideOnPages = ['/signin', '/signup', '/auth', '/settings', '/onboarding', '/create', '/edit', '/notifications', '/search', '/p/', '/groups/new', '/trips/create']
  const shouldHide = hideOnPages.some(path => pathname?.startsWith(path))

  if (shouldHide) {
    return null
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-safe">
      <div className="flex items-center justify-around h-16 max-w-screen-xl mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.active

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center min-w-[48px] flex-1 py-1',
                'transition-all duration-200',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={cn(
                    'h-6 w-6 transition-all duration-200',
                    isActive && 'scale-110 stroke-[2.5]'
                  )}
                  strokeWidth={2}
                />
                {isActive && (
                  <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary" />
                )}
              </div>
              <span className={cn(
                'text-[10px] mt-0.5 font-medium transition-all duration-200',
                isActive && 'font-semibold'
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
