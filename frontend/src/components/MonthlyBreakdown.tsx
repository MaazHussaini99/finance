import { useState, useEffect } from 'react'
import { api } from '../api'
import type { MonthlyData, Category } from '../types'

function MonthlyBreakdown() {
  const [monthlyData, setMonthlyData] = useState<MonthlyData>({})
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [monthly, cats] = await Promise.all([
        api.transactions.getMonthly(),
        api.categories.getAll()
      ])
      setMonthlyData(monthly)
      setCategories(cats)
    } catch (error) {
      console.error('Error loading monthly data:', error)
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
    return new Date(`${year}-${month}-01`).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    })
  }

  const getCategoryInfo = (categoryName: string) => {
    const category = categories.find(c => c.name === categoryName)
    return {
      color: category?.color || '#3b82f6',
      icon: category?.icon || '📁'
    }
  }

  const getMonthTotal = (monthData: MonthlyData[string]) => {
    return monthData.reduce((sum, item) => sum + item.total, 0)
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  const months = Object.keys(monthlyData).sort().reverse()

  return (
    <div className="card">
      <h2>Monthly Breakdown</h2>

      {months.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
          No transactions yet. Upload some transactions to see your monthly breakdown.
        </p>
      ) : (
        <div className="monthly-breakdown">
          {months.map(month => {
            const data = monthlyData[month]
            const monthTotal = getMonthTotal(data)
            const expenses = data.filter(d => d.total < 0)
            const income = data.filter(d => d.total >= 0)

            return (
              <div key={month} className="month-section">
                <div className="month-header">
                  <span>{formatMonth(month)}</span>
                  <span className="month-total">{formatCurrency(monthTotal)}</span>
                </div>

                {income.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ color: '#22c55e', marginBottom: '1rem', fontSize: '1.2rem' }}>
                      Income
                    </h3>
                    <div className="category-breakdown">
                      {income.map((item, idx) => {
                        const info = getCategoryInfo(item.category)
                        return (
                          <div key={idx} className="category-item">
                            <div className="category-info">
                              <span className="category-icon">{info.icon}</span>
                              <div className="category-details">
                                <h4>{item.category}</h4>
                                <p>{item.count} transactions</p>
                              </div>
                            </div>
                            <div className="category-amount" style={{ color: '#22c55e' }}>
                              {formatCurrency(item.total)}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {expenses.length > 0 && (
                  <div>
                    <h3 style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '1.2rem' }}>
                      Expenses
                    </h3>
                    <div className="category-breakdown">
                      {expenses
                        .sort((a, b) => a.total - b.total)
                        .map((item, idx) => {
                          const info = getCategoryInfo(item.category)
                          return (
                            <div key={idx} className="category-item">
                              <div className="category-info">
                                <span className="category-icon">{info.icon}</span>
                                <div className="category-details">
                                  <h4>{item.category}</h4>
                                  <p>{item.count} transactions</p>
                                </div>
                              </div>
                              <div className="category-amount">
                                {formatCurrency(Math.abs(item.total))}
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MonthlyBreakdown
