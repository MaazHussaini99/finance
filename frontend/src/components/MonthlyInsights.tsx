import { useState, useEffect } from 'react'
import { api } from '../api'

interface MonthlyInsight {
  month: string
  year: number
  month_num: number
  income: number
  expenses: number
  net_change: number
  ending_balance: number
  transaction_count: number
  income_count: number
  expense_count: number
}

function MonthlyInsights() {
  const [insights, setInsights] = useState<MonthlyInsight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInsights()
  }, [])

  const loadInsights = async () => {
    try {
      const data = await api.transactions.getInsights()
      setInsights(data)
    } catch (error) {
      console.error('Error loading insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading insights...</div>
  }

  if (insights.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
        No transaction data available yet. Connect your accounts to see insights!
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ marginBottom: '2rem' }}>Monthly Financial Insights</h2>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {insights.map((insight) => {
          const isPositive = insight.net_change >= 0
          const balanceColor = insight.ending_balance >= 0 ? '#22c55e' : '#ef4444'

          return (
            <div
              key={insight.month}
              style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '600' }}>
                {formatMonth(insight.month)}
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                {/* Income Card */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                    💰 Income
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#22c55e' }}>
                    {formatCurrency(insight.income)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                    {insight.income_count} transaction{insight.income_count !== 1 ? 's' : ''}
                  </div>
                </div>

                {/* Expenses Card */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                    💸 Expenses
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#ef4444' }}>
                    {formatCurrency(insight.expenses)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                    {insight.expense_count} transaction{insight.expense_count !== 1 ? 's' : ''}
                  </div>
                </div>

                {/* Net Change Card */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                    📊 Net Change
                  </div>
                  <div
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: '600',
                      color: isPositive ? '#22c55e' : '#ef4444'
                    }}
                  >
                    {isPositive ? '+' : ''}{formatCurrency(insight.net_change)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                    {insight.transaction_count} total transaction{insight.transaction_count !== 1 ? 's' : ''}
                  </div>
                </div>

                {/* Ending Balance Card */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    background: `${balanceColor}08`,
                    padding: '1rem',
                    borderRadius: '8px',
                    border: `2px solid ${balanceColor}20`
                  }}
                >
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                    🏦 Ending Balance
                  </div>
                  <div
                    style={{
                      fontSize: '1.75rem',
                      fontWeight: '700',
                      color: balanceColor
                    }}
                  >
                    {formatCurrency(insight.ending_balance)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                    Cumulative balance
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
                  <span>Savings Rate: {insight.income > 0 ? ((insight.income - insight.expenses) / insight.income * 100).toFixed(1) : 0}%</span>
                  <span>Spending: {insight.income > 0 ? (insight.expenses / insight.income * 100).toFixed(1) : 0}% of income</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${insight.income > 0 ? Math.min((insight.expenses / insight.income) * 100, 100) : 0}%`,
                      height: '100%',
                      background: insight.expenses > insight.income ? '#ef4444' : '#3b82f6',
                      transition: 'width 0.3s'
                    }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MonthlyInsights
