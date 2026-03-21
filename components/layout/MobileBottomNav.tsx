'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Heart, Plus, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MobileBottomNav() {
  const pathname = usePathname()

  const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/search', icon: Search, label: 'Search' },
    { href: '/create', icon: Plus, label: 'Create', isPrimary: true },
    { href: '/notifications', icon: Heart, label: 'Notifications' },
    { href: '/settings', icon: User, label: 'Settings' },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          if (item.isPrimary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center min-w-[60px] -mt-4"
              >
                <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
                  <Icon className="h-6 w-6" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] mt-1 font-medium">{item.label}</span>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center min-w-[48px] py-1 px-2 transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon
                className={cn(
                  'h-6 w-6 transition-all',
                  isActive && 'fill-current stroke-none'
                )}
                strokeWidth={2}
              />
              <span className={cn(
                'text-[10px] mt-0.5 font-medium transition-all',
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
