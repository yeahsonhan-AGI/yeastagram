import type { ExpenseSettlement, GroupExpense, GroupMember, Currency } from '@/types'

const CURRENCY_CONFIG = {
  CNY: { symbol: '¥', name: 'Chinese Yuan', decimalPlaces: 2 },
  USD: { symbol: '$', name: 'US Dollar', decimalPlaces: 2 },
  IDR: { symbol: 'Rp', name: 'Indonesian Rupiah', decimalPlaces: 0 },
  JPY: { symbol: '¥', name: 'Japanese Yen', decimalPlaces: 0 },
  KRW: { symbol: '₩', name: 'South Korean Won', decimalPlaces: 0 },
  GBP: { symbol: '£', name: 'British Pound', decimalPlaces: 2 },
  EUR: { symbol: '€', name: 'Euro', decimalPlaces: 2 },
} as const

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: Currency = 'CNY'): string {
  const config = CURRENCY_CONFIG[currency]
  const absAmount = Math.abs(amount)
  const formatted = absAmount.toFixed(config.decimalPlaces)
  return `${config.symbol}${formatted}`
}

/**
 * Get available currencies list
 */
export function getAvailableCurrencies(): Array<{ code: Currency; symbol: string; name: string }> {
  return Object.entries(CURRENCY_CONFIG).map(([code, config]) => ({
    code: code as Currency,
    symbol: config.symbol,
    name: config.name,
  }))
}

/**
 * Calculate expense settlements for a group
 * Uses a simplified algorithm to determine who needs to pay whom
 */
export function calculateSettlements(
  expenses: GroupExpense[],
  members: GroupMember[]
): ExpenseSettlement[] {
  // Initialize user balances
  const userBalances = new Map<string, {
    paid: number
    owed: number
    profile: any
  }>()

  members.forEach(m => {
    userBalances.set(m.user_id, {
      paid: 0,
      owed: 0,
      profile: m.user,
    })
  })

  // Calculate each user's paid and owed amounts
  expenses.forEach(expense => {
    // Add to payer's paid amount
    const payerBalance = userBalances.get(expense.payer_id)
    if (payerBalance) {
      payerBalance.paid += Number(expense.amount)
    }

    // Add to each user's owed amount from splits
    expense.splits?.forEach(split => {
      const userBalance = userBalances.get(split.user_id)
      if (userBalance) {
        userBalance.owed += Number(split.amount)
      }
    })
  })

  // Separate users with positive and negative balances
  const positiveBalances: { userId: string; amount: number; profile: any }[] = []
  const negativeBalances: { userId: string; amount: number; profile: any }[] = []

  const settlements: ExpenseSettlement[] = []

  userBalances.forEach((balance, userId) => {
    const netBalance = balance.paid - balance.owed

    if (netBalance > 0.01) {
      positiveBalances.push({
        userId,
        amount: netBalance,
        profile: balance.profile,
      })
    } else if (netBalance < -0.01) {
      negativeBalances.push({
        userId,
        amount: -netBalance,
        profile: balance.profile,
      })
    }

    settlements.push({
      user_id: userId,
      user: balance.profile,
      total_paid: balance.paid,
      total_owed: balance.owed,
      balance: netBalance,
      settlements: [],
    })
  })

  // Sort by amount (descending)
  positiveBalances.sort((a, b) => b.amount - a.amount)
  negativeBalances.sort((a, b) => b.amount - a.amount)

  // Calculate who needs to pay whom (greedy algorithm)
  let i = 0, j = 0
  while (i < positiveBalances.length && j < negativeBalances.length) {
    const receiver = positiveBalances[i]
    const payer = negativeBalances[j]
    const amount = Math.min(receiver.amount, payer.amount)

    const receiverSettlement = settlements.find(s => s.user_id === receiver.userId)
    const payerSettlement = settlements.find(s => s.user_id === payer.userId)

    if (receiverSettlement && payerSettlement) {
      receiverSettlement.settlements.push({
        with_user_id: payer.userId,
        with_user: payer.profile,
        amount: Math.round(amount * 100) / 100, // Round to 2 decimal places
      })
    }

    receiver.amount -= amount
    payer.amount -= amount

    if (receiver.amount < 0.01) i++
    if (payer.amount < 0.01) j++
  }

  // Return only users with non-zero balances or settlements
  return settlements.filter(
    s => s.settlements.length > 0 || Math.abs(s.balance) > 0.01
  )
}

/**
 * Get status text for a settlement
 */
export function getSettlementStatusText(balance: number): string {
  if (Math.abs(balance) < 0.01) return 'Settled'
  if (balance > 0) return 'Should receive'
  return 'Should pay'
}

/**
 * Get status color class for a settlement
 */
export function getSettlementStatusColor(balance: number): string {
  if (Math.abs(balance) < 0.01) return 'text-green-600'
  if (balance > 0) return 'text-blue-600'
  return 'text-orange-600'
}
