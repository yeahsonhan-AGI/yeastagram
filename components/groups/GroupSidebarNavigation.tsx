'use client'

import { Users, MapPin, Calendar, ClipboardList, Receipt, Link2, Menu, ChevronDown } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface GroupSidebarNavigationProps {
  selectedTab: string
  onTabChange: (tab: string) => void
  onInviteClick: () => void
  isMember: boolean
  isLeader: boolean
}

interface NavItem {
  value: string
  label: string
  icon: typeof Users
  showTab: boolean
  isAction?: boolean
}

export function GroupSidebarNavigation({
  selectedTab,
  onTabChange,
  onInviteClick,
  isMember,
  isLeader,
}: GroupSidebarNavigationProps) {
  const navItems: NavItem[] = [
    {
      value: 'members',
      label: 'Members',
      icon: Users,
      showTab: true,
    },
    {
      value: 'location',
      label: 'Location',
      icon: MapPin,
      showTab: isMember,
    },
    {
      value: 'itinerary',
      label: 'Itinerary',
      icon: Calendar,
      showTab: true,
    },
    {
      value: 'requests',
      label: 'Requests',
      icon: ClipboardList,
      showTab: isLeader,
    },
    {
      value: 'expenses',
      label: 'Expenses',
      icon: Receipt,
      showTab: isMember,
    },
  ]

  const inviteItem: NavItem = {
    value: 'invite',
    label: 'Invite Members',
    icon: Link2,
    showTab: isLeader,
    isAction: true,
  }

  const visibleNavItems = navItems.filter((item) => item.showTab)
  const visibleInviteItem = inviteItem.showTab ? inviteItem : null

  const getCurrentTabLabel = () => {
    const currentItem = visibleNavItems.find((item) => item.value === selectedTab)
    return currentItem?.label || 'Members'
  }

  const handleNavClick = (item: NavItem) => {
    if (item.isAction) {
      onInviteClick()
    } else {
      onTabChange(item.value)
    }
  }

  return (
    <>
      {/* Desktop Sidebar - Fixed 64px width */}
      <TooltipProvider delayDuration={0}>
        <div className="hidden md:flex fixed left-0 top-0 bottom-0 w-16 flex-col items-center py-4 bg-card border-r border-border z-40">
          <div className="flex flex-col items-center gap-2 w-full">
            {visibleNavItems.map((item) => {
              const Icon = item.icon
              const isActive = selectedTab === item.value

              return (
                <Tooltip key={item.value}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleNavClick(item)}
                      className={cn(
                        'relative group flex items-center justify-center w-12 h-12 rounded-lg mx-2 transition-all duration-200',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                      aria-label={item.label}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="ml-2">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              )
            })}
            {visibleInviteItem && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleNavClick(visibleInviteItem)}
                    className="relative group flex items-center justify-center w-12 h-12 rounded-lg mx-2 transition-all duration-200 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    aria-label={visibleInviteItem.label}
                  >
                    <visibleInviteItem.icon className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-2">
                  <p>{visibleInviteItem.label}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </TooltipProvider>

      {/* Mobile Drawer - Pull-out from left */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger
            render={
              <Button variant="ghost" className="h-12 px-3 justify-start gap-2">
                <Menu className="w-5 h-5" />
                <span className="font-medium">{getCurrentTabLabel()}</span>
                <ChevronDown className="w-4 h-4 ml-auto" />
              </Button>
            }
          />
          <SheetContent
            side="left"
            className="w-72 p-0 bg-card"
            aria-describedby={undefined}
          >
            <SheetHeader className="p-4 pb-2 border-b border-border">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <div className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-8rem)]">
              {visibleNavItems.map((item) => {
                const Icon = item.icon
                const isActive = selectedTab === item.value

                return (
                  <button
                    key={item.value}
                    onClick={() => handleNavClick(item)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                )
              })}
              {visibleInviteItem && (
                <button
                  onClick={() => handleNavClick(visibleInviteItem)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <visibleInviteItem.icon className="h-5 w-5 shrink-0" />
                  <span className="font-medium">{visibleInviteItem.label}</span>
                </button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
