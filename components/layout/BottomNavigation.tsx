'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
  const hideOnPages = ['/signin', '/signup', '/auth', '/settings', '/onboarding', '/create', '/edit', '/notifications', '/search']
  const shouldHide = hideOnPages.some(path => pathname?.startsWith(path))

  if (shouldHide) {
    return null
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 max-w-screen-xl mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.active

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center min-w-0 flex-1 h-full',
                'transition-colors duration-200',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="relative flex items-center justify-center">
                <Icon className="h-6 w-6" strokeWidth={2} />
              </div>
              <span className="text-xs mt-1 font-medium">
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
