import { useState, useEffect } from 'react'
import { api } from '../api'
import type { Transaction, Category, CategoryStats } from '../types'

function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [stats, setStats] = useState<CategoryStats[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editCategory, setEditCategory] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [transactionsData, categoriesData, statsData] = await Promise.all([
        api.transactions.getAll(),
        api.categories.getAll(),
        api.transactions.getStats()
      ])
      setTransactions(transactionsData)
      setCategories(categoriesData)
      setStats(statsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditCategory = (transaction: Transaction) => {
    setEditingId(transaction.id)
    setEditCategory(transaction.category)
  }

  const handleSaveCategory = async (id: number) => {
    try {
      await api.transactions.update(id, { category: editCategory })
      setEditingId(null)
      loadData()
    } catch (error) {
      console.error('Error updating category:', error)
    }
  }

  const getCategoryColor = (categoryName: string) => {
    const category = categories.find(c => c.name === categoryName)
    return category?.color || '#3b82f6'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const totalSpent = stats
    .filter(s => s.total < 0)
    .reduce((sum, s) => sum + s.total, 0)

  const totalIncome = stats
    .filter(s => s.total > 0)
    .reduce((sum, s) => sum + s.total, 0)

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Transactions</h3>
          <p>{transactions.length}</p>
        </div>
        <div className="stat-card">
          <h3>Total Spent</h3>
          <p>{formatCurrency(Math.abs(totalSpent))}</p>
        </div>
        <div className="stat-card">
          <h3>Total Income</h3>
          <p>{formatCurrency(totalIncome)}</p>
        </div>
        <div className="stat-card">
          <h3>Net</h3>
          <p>{formatCurrency(totalIncome + totalSpent)}</p>
        </div>
      </div>

      <div className="card">
        <h2>Category Summary</h2>
        <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
          {stats.map(stat => (
            <div
              key={stat.category}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                background: '#f8f9fa',
                borderRadius: '8px',
                borderLeft: `4px solid ${getCategoryColor(stat.category)}`
              }}
            >
              <div>
                <strong>{stat.category}</strong>
                <div style={{ color: '#6c757d', fontSize: '0.875rem' }}>
                  {stat.count} transactions
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                  {formatCurrency(stat.total)}
                </div>
                <div style={{ color: '#6c757d', fontSize: '0.875rem' }}>
                  avg: {formatCurrency(stat.average)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>Recent Transactions</h2>
        <div className="transactions-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Institution</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 50).map(transaction => (
                <tr key={transaction.id}>
                  <td>{formatDate(transaction.date)}</td>
                  <td>{transaction.description}</td>
                  <td>{transaction.institution}</td>
                  <td>
                    {editingId === transaction.id ? (
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        style={{
                          padding: '0.25rem',
                          borderRadius: '4px',
                          border: '1px solid #ddd'
                        }}
                      >
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className="category-badge"
                        style={{
                          background: getCategoryColor(transaction.category),
                          color: 'white'
                        }}
                      >
                        {transaction.category}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={transaction.amount >= 0 ? 'amount-positive' : 'amount-negative'}>
                      {formatCurrency(transaction.amount)}
                    </span>
                  </td>
                  <td>
                    {editingId === transaction.id ? (
                      <>
                        <button
                          className="edit-btn"
                          onClick={() => handleSaveCategory(transaction.id)}
                          style={{ marginRight: '0.5rem' }}
                        >
                          Save
                        </button>
                        <button
                          className="edit-btn"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        className="edit-btn"
                        onClick={() => handleEditCategory(transaction)}
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

export default Dashboard
