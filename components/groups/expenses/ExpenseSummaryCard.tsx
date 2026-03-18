'use client'

import { TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react'
import { formatCurrency, getSettlementStatusColor, getSettlementStatusText } from '@/lib/expenses/calculator'
import type { Currency } from '@/types'

interface ExpenseSummaryCardProps {
  teamTotal: number
  userTotal: number
  userOwed: number
  userBalance: number
  currentUserId?: string
  currency?: Currency
}

export function ExpenseSummaryCard({
  teamTotal,
  userTotal,
  userOwed,
  userBalance,
  currentUserId,
  currency = 'CNY',
}: ExpenseSummaryCardProps) {
  if (!currentUserId) {
    return (
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">Team Total</div>
            <div className="text-2xl font-bold mt-1">{formatCurrency(teamTotal, currency)}</div>
          </div>
          <TrendingUp className="w-8 h-8 text-muted-foreground" />
        </div>
      </div>
    )
  }

  const balanceStatus = getSettlementStatusText(userBalance)
  const balanceColor = getSettlementStatusColor(userBalance)

  return (
    <div className="space-y-3">
      {/* Team Total - Highlighted */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              Team Total
            </div>
            <div className="text-3xl font-bold mt-1">{formatCurrency(teamTotal)}</div>
          </div>
          <div className="bg-primary/20 rounded-full p-3">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
        </div>
      </div>

      {/* My Payment Summary */}
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="text-sm font-medium mb-3">My Payment</div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Paid</div>
            <div className="font-semibold">{formatCurrency(userTotal, currency)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Should Pay</div>
            <div className="font-semibold">{formatCurrency(userOwed, currency)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Balance</div>
            <div className={`font-semibold ${balanceColor}`}>
              {userBalance > 0 ? '+' : ''}{formatCurrency(userBalance, currency)}
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <div className={`flex items-center gap-1 text-sm font-medium ${balanceColor}`}>
              {Math.abs(userBalance) < 0.01 ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  {balanceStatus}
                </>
              ) : userBalance > 0 ? (
                <>
                  <TrendingDown className="w-4 h-4" />
                  {balanceStatus} {formatCurrency(Math.abs(userBalance), currency)}
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4" />
                  {balanceStatus} {formatCurrency(Math.abs(userBalance), currency)}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
