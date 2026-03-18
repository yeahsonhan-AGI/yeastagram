'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Trash2, Receipt } from 'lucide-react'
import { formatCurrency } from '@/lib/expenses/calculator'
import type { ExpenseGroup, GroupExpense } from '@/types'

interface ExpenseGroupedListProps {
  expenseGroups: {
    myExpenses: ExpenseGroup | null
    othersExpenses: ExpenseGroup[]
  }
  currentUserId?: string
  isLeader: boolean
  onDeleteExpense: (expenseId: string) => void
}

export function ExpenseGroupedList({
  expenseGroups,
  currentUserId,
  isLeader,
  onDeleteExpense,
}: ExpenseGroupedListProps) {
  const hasExpenses = expenseGroups.myExpenses || expenseGroups.othersExpenses.length > 0

  if (!hasExpenses) {
    return (
      <div className="text-center py-8">
        <Receipt className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
        <p className="text-muted-foreground">No expense records yet</p>
      </div>
    )
  }

  const renderExpenseItem = (expense: GroupExpense) => {
    const canDelete = expense.payer_id === currentUserId || isLeader

    return (
      <div
        key={expense.id}
        className="flex items-center justify-between p-3 bg-background rounded-lg border hover:border-primary/30 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{expense.name}</div>
          <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
            <span>{new Date(expense.expense_date).toLocaleDateString('en-US')}</span>
            <span className="w-1 h-1 bg-muted-foreground/50 rounded-full" />
            <span>{expense.split_type === 'equal' ? 'Equal Split' : 'Custom'}</span>
            {expense.splits && expense.splits.length > 0 && (
              <>
                <span className="w-1 h-1 bg-muted-foreground/50 rounded-full" />
                <span>{expense.splits.length} people</span>
              </>
            )}
          </div>
          {expense.notes && (
            <div className="text-sm text-muted-foreground mt-1 truncate">{expense.notes}</div>
          )}
        </div>
        <div className="flex items-center gap-3 ml-3">
          <div className="text-right">
            <div className="font-semibold text-lg">{formatCurrency(expense.amount, expense.currency)}</div>
          </div>
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteExpense(expense.id)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  const renderExpenseGroup = (group: ExpenseGroup, isCurrentUser: boolean = false) => {
    const { payer, expenses, totalAmount } = group
    const userName = payer.username || payer.full_name || 'User'
    const isMe = payer.id === currentUserId

    return (
      <div key={payer.id} className="space-y-3">
        {/* Group Header */}
        <div className={`flex items-center justify-between px-1 ${
          isMe ? 'text-primary' : 'text-foreground'
        }`}>
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src={payer.avatar_url || undefined} />
              <AvatarFallback className={isMe ? 'bg-primary text-primary-foreground text-xs' : 'text-xs'}>
                {isMe ? 'Me' : userName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-sm">
              {isMe ? 'My Payments' : `@${userName}'s Payments`}
            </span>
            <span className="text-xs text-muted-foreground">
              ({expenses.length} {expenses.length === 1 ? 'item' : 'items'})
            </span>
          </div>
          <span className={`font-bold ${isMe ? 'text-primary' : ''}`}>
            {formatCurrency(totalAmount, expenses[0]?.currency || 'CNY')}
          </span>
        </div>

        {/* Expense Items */}
        <div className="space-y-2 pl-2">
          {expenses.map((expense) => renderExpenseItem(expense))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* My Expenses - Highlighted if exists */}
      {expenseGroups.myExpenses && (
        <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
          {renderExpenseGroup(expenseGroups.myExpenses, true)}
        </div>
      )}

      {/* Other Members' Expenses */}
      {expenseGroups.othersExpenses.length > 0 && (
        <div className="space-y-6">
          {expenseGroups.othersExpenses.map((group) => renderExpenseGroup(group))}
        </div>
      )}
    </div>
  )
}
