'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatCurrency } from '@/lib/expenses/calculator'
import type { UserExpenseStats, Currency } from '@/types'

interface MemberExpenseStatsProps {
  members: UserExpenseStats[]
  currentUserId?: string
  teamTotal: number
  currency?: Currency
}

export function MemberExpenseStats({ members, currentUserId, teamTotal, currency = 'CNY' }: MemberExpenseStatsProps) {
  if (members.length === 0 || teamTotal === 0) {
    return null
  }

  // Sort by amount descending, but keep current user first if they exist
  const sortedMembers = [...members].sort((a, b) => {
    if (currentUserId) {
      if (a.userId === currentUserId) return -1
      if (b.userId === currentUserId) return 1
    }
    return b.totalPaid - a.totalPaid
  })

  const getUserLabel = (profile: UserExpenseStats['profile'], userId: string) => {
    if (userId === currentUserId) return 'Me'
    return profile.username || profile.full_name || 'User'
  }

  return (
    <div className="bg-muted/30 rounded-lg p-4">
      <div className="text-sm font-medium mb-3 flex items-center gap-2">
        <span>Member Expense Stats</span>
        <span className="text-xs text-muted-foreground font-normal">
          ({sortedMembers.length} people)
        </span>
      </div>
      <div className="space-y-2">
        {sortedMembers.map((member) => {
          const isCurrentUser = member.userId === currentUserId
          return (
            <div
              key={member.userId}
              className={`flex items-center justify-between p-2 rounded-md transition-colors ${
                isCurrentUser ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={member.profile.avatar_url || undefined} />
                  <AvatarFallback className={isCurrentUser ? 'bg-primary text-primary-foreground' : ''}>
                    {getUserLabel(member.profile, member.userId).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className={`font-medium text-sm ${isCurrentUser ? 'text-primary' : ''}`}>
                    {isCurrentUser ? '@' : ''}{getUserLabel(member.profile, member.userId)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {member.expenseCount} {member.expenseCount === 1 ? 'item' : 'items'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-semibold ${isCurrentUser ? 'text-primary' : ''}`}>
                  {formatCurrency(member.totalPaid, currency)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {member.percentage.toFixed(0)}%
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
