'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import type { GroupExpense, ExpenseGroup, UserExpenseStats } from '@/types'
import { formatCurrency, getAvailableCurrencies } from '@/lib/expenses/calculator'
import { ExpenseSummaryCard } from './expenses/ExpenseSummaryCard'
import { MemberExpenseStats } from './expenses/MemberExpenseStats'
import { ExpenseGroupedList } from './expenses/ExpenseGroupedList'

interface ExpenseListProps {
  groupId: string
  currentUserId?: string
  isLeader: boolean
}

export function ExpenseList({ groupId, currentUserId, isLeader }: ExpenseListProps) {
  const [expenses, setExpenses] = useState<GroupExpense[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const fetchExpenses = async () => {
    console.log('fetchExpenses called, groupId:', groupId)
    setIsLoading(true)
    try {
      const response = await fetch(`/api/groups/${groupId}/expenses`)
      console.log('fetchExpenses response:', response.status)
      if (!response.ok) throw new Error('Failed to fetch expenses')
      const data = await response.json()
      console.log('fetchExpenses data:', data)
      setExpenses(data.expenses)
    } catch (error) {
      console.error('fetchExpenses error:', error)
      toast.error('Failed to fetch expense list')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    console.log('ExpenseList mounted, groupId:', groupId)
    fetchExpenses()
  }, [groupId])

  const handleAddExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log('handleAddExpense called')
    const formData = new FormData(e.currentTarget)

    const expenseData = {
      name: formData.get('name') as string,
      amount: parseFloat(formData.get('amount') as string),
      currency: (formData.get('currency') as string) || 'CNY',
      expense_date: formData.get('expense_date') as string,
      notes: formData.get('notes') as string || undefined,
      split_type: (formData.get('split_type') as string) || 'equal',
    }

    console.log('Sending expense data:', expenseData)

    setIsLoading(true)
    try {
      const response = await fetch(`/api/groups/${groupId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData),
      })

      console.log('POST response status:', response.status)
      const result = await response.json()
      console.log('POST response data:', result)

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add')
      }

      toast.success('Expense added successfully')
      setIsAddDialogOpen(false)
      fetchExpenses()
    } catch (error) {
      console.error('handleAddExpense error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense record?')) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/groups/${groupId}/expenses?expenseId=${expenseId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete')
      }

      toast.success('Deleted successfully')
      fetchExpenses()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete')
    } finally {
      setIsLoading(false)
    }
  }

  // Group expenses by payer
  const expenseGroups = useMemo(() => {
    const grouped = new Map<string, ExpenseGroup>()

    expenses.forEach((expense) => {
      if (!expense.payer) return

      const payerId = expense.payer_id
      if (!grouped.has(payerId)) {
        grouped.set(payerId, {
          payer: expense.payer,
          expenses: [],
          totalAmount: 0,
        })
      }
      const group = grouped.get(payerId)!
      group.expenses.push(expense)
      group.totalAmount += expense.amount
    })

    // Sort expenses within each group by date (newest first)
    grouped.forEach((group) => {
      group.expenses.sort((a, b) =>
        new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime()
      )
    })

    const myExpenses = grouped.get(currentUserId || '') || null
    const othersExpenses = Array.from(grouped.values())
      .filter((g) => g.payer.id !== currentUserId)
      .sort((a, b) => b.totalAmount - a.totalAmount)

    return { myExpenses, othersExpenses }
  }, [expenses, currentUserId])

  // Calculate member statistics
  const memberStats = useMemo(() => {
    const stats = new Map<string, UserExpenseStats>()
    const teamTotal = expenses.reduce((sum, e) => sum + e.amount, 0)

    // First pass: collect all unique payers
    expenses.forEach((expense) => {
      if (!expense.payer) return

      const payerId = expense.payer_id
      if (!stats.has(payerId)) {
        stats.set(payerId, {
          userId: payerId,
          profile: expense.payer,
          totalPaid: 0,
          expenseCount: 0,
          percentage: 0,
        })
      }
    })

    // Second pass: calculate totals
    expenses.forEach((expense) => {
      if (!expense.payer) return

      const stat = stats.get(expense.payer_id)!
      stat.totalPaid += expense.amount
      stat.expenseCount += 1
    })

    // Calculate percentages
    stats.forEach((stat) => {
      stat.percentage = teamTotal > 0 ? (stat.totalPaid / teamTotal) * 100 : 0
    })

    return Array.from(stats.values())
  }, [expenses])

  // Calculate totals for summary card
  const totals = useMemo(() => {
    const teamTotal = expenses.reduce((sum, e) => sum + e.amount, 0)
    const userTotal = expenses
      .filter((e) => e.payer_id === currentUserId)
      .reduce((sum, e) => sum + e.amount, 0)

    // Calculate user's owed amount
    let userOwed = 0
    expenses.forEach((expense) => {
      expense.splits?.forEach((split) => {
        if (split.user_id === currentUserId) {
          userOwed += split.amount
        }
      })
    })

    const userBalance = userTotal - userOwed

    return { teamTotal, userTotal, userOwed, userBalance }
  }, [expenses, currentUserId])

  // Get primary currency from first expense, default to CNY
  const primaryCurrency = expenses.length > 0 ? expenses[0].currency : 'CNY'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            <CardTitle>Expense Splitting</CardTitle>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add Expense
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Expense</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Expense Name</label>
                  <Input name="name" placeholder="e.g. Transportation, Tickets..." required />
                </div>
                <div>
                  <label className="text-sm font-medium">Amount</label>
                  <Input name="amount" type="number" step="0.01" placeholder="0.00" required />
                </div>
                <div>
                  <label className="text-sm font-medium">Currency</label>
                  <Select name="currency" defaultValue="CNY">
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CNY">
                        <span className="flex items-center gap-2">
                          <span>¥</span>
                          <span>CNY - Chinese Yuan</span>
                        </span>
                      </SelectItem>
                      <SelectItem value="USD">
                        <span className="flex items-center gap-2">
                          <span>$</span>
                          <span>USD - US Dollar</span>
                        </span>
                      </SelectItem>
                      <SelectItem value="IDR">
                        <span className="flex items-center gap-2">
                          <span>Rp</span>
                          <span>IDR - Indonesian Rupiah</span>
                        </span>
                      </SelectItem>
                      <SelectItem value="JPY">
                        <span className="flex items-center gap-2">
                          <span>¥</span>
                          <span>JPY - Japanese Yen</span>
                        </span>
                      </SelectItem>
                      <SelectItem value="KRW">
                        <span className="flex items-center gap-2">
                          <span>₩</span>
                          <span>KRW - South Korean Won</span>
                        </span>
                      </SelectItem>
                      <SelectItem value="GBP">
                        <span className="flex items-center gap-2">
                          <span>£</span>
                          <span>GBP - British Pound</span>
                        </span>
                      </SelectItem>
                      <SelectItem value="EUR">
                        <span className="flex items-center gap-2">
                          <span>€</span>
                          <span>EUR - Euro</span>
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <Input
                    name="expense_date"
                    type="date"
                    required
                    min="2000-01-01"
                    max="2100-12-31"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Split Method</label>
                  <Select name="split_type" defaultValue="equal">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equal">Equal Split</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Notes (Optional)</label>
                  <Textarea name="notes" placeholder="Add notes..." rows={2} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    Add
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-8">
            <Wallet className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">No expense records yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Card */}
            <ExpenseSummaryCard
              teamTotal={totals.teamTotal}
              userTotal={totals.userTotal}
              userOwed={totals.userOwed}
              userBalance={totals.userBalance}
              currentUserId={currentUserId}
              currency={primaryCurrency}
            />

            {/* Member Statistics */}
            <MemberExpenseStats
              members={memberStats}
              currentUserId={currentUserId}
              teamTotal={totals.teamTotal}
              currency={primaryCurrency}
            />

            {/* Grouped Expense List */}
            <div>
              <h3 className="text-sm font-medium mb-4 text-muted-foreground">Expense Details (Grouped by Payer)</h3>
              <ExpenseGroupedList
                expenseGroups={expenseGroups}
                currentUserId={currentUserId}
                isLeader={isLeader}
                onDeleteExpense={handleDeleteExpense}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
