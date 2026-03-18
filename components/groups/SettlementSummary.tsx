'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calculator, ArrowUpDown } from 'lucide-react'
import { toast } from 'sonner'
import type { ExpenseSettlement, Currency } from '@/types'
import { formatCurrency, getSettlementStatusColor, getSettlementStatusText } from '@/lib/expenses/calculator'

interface SettlementSummaryProps {
  groupId: string
  currentUserId?: string
  currency?: Currency
}

export function SettlementSummary({ groupId, currentUserId, currency = 'CNY' }: SettlementSummaryProps) {
  const [settlements, setSettlements] = useState<ExpenseSettlement[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchSettlements = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/groups/${groupId}/expenses/settlements`)
      if (!response.ok) throw new Error('Failed to fetch settlements')
      const data = await response.json()
      setSettlements(data.settlements)
    } catch (error) {
      toast.error('Failed to fetch settlement information')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSettlements()
  }, [groupId])

  const currentUserSettlement = settlements.find(s => s.user_id === currentUserId)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Expense Settlement</CardTitle>
          <Button variant="outline" size="sm" onClick={fetchSettlements} disabled={isLoading}>
            <Calculator className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Calculating...</div>
        ) : settlements.length === 0 ? (
          <div className="text-center py-8">
            <Calculator className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">No expense records yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Current user's settlement summary */}
            {currentUserSettlement && (
              <div className="bg-muted rounded-lg p-4">
                <div className="font-medium mb-2">My Settlement</div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Paid: {formatCurrency(currentUserSettlement.total_paid, currency)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Should Pay: {formatCurrency(currentUserSettlement.total_owed, currency)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-semibold ${getSettlementStatusColor(currentUserSettlement.balance)}`}>
                      {formatCurrency(currentUserSettlement.balance, currency)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {getSettlementStatusText(currentUserSettlement.balance)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* All settlements */}
            <div className="space-y-3">
              <div className="font-medium text-sm">Settlement Details</div>
              {settlements
                .filter(s => s.settlements.length > 0)
                .map((settlement) => (
                  <div key={settlement.user_id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">
                        {settlement.user?.username || settlement.user?.full_name || 'User'}
                      </div>
                      <div className={`font-semibold ${getSettlementStatusColor(settlement.balance)}`}>
                        {getSettlementStatusText(settlement.balance)} {formatCurrency(Math.abs(settlement.balance), currency)}
                      </div>
                    </div>

                    {settlement.settlements.length > 0 && (
                      <div className="space-y-1">
                        {settlement.settlements.map((s, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                            {settlement.balance > 0 ? (
                              <span>
                                Should receive <strong>{s.with_user?.username || s.with_user?.full_name}</strong> {formatCurrency(s.amount, currency)}
                              </span>
                            ) : (
                              <span>
                                Should pay <strong>{s.with_user?.username || s.with_user?.full_name}</strong> {formatCurrency(s.amount, currency)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
