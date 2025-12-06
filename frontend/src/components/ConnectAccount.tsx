import { useState, useEffect } from 'react'
import { api } from '../api'

interface ConnectAccountProps {
  onSuccess?: () => void
}

function ConnectAccount({ onSuccess }: ConnectAccountProps) {
  const [accounts, setAccounts] = useState<any[]>([])
  const [syncing, setSyncing] = useState<number | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showTokenInput, setShowTokenInput] = useState(false)
  const [accessToken, setAccessToken] = useState('')

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      const data = await api.teller.getAccounts()
      setAccounts(data)
    } catch (error) {
      console.error('Error loading accounts:', error)
    }
  }

  const handleConnectClick = () => {
    window.open('https://teller.io/connect', '_blank', 'width=500,height=700')
    setShowTokenInput(true)
  }

  const handleSaveToken = async () => {
    if (!accessToken.trim()) {
      setMessage({ type: 'error', text: 'Please enter an access token' })
      return
    }

    try {
      await api.teller.saveEnrollment(accessToken.trim())
      setMessage({ type: 'success', text: 'Account connected successfully!' })
      setAccessToken('')
      setShowTokenInput(false)
      loadAccounts()
      onSuccess?.()
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to connect account'
      })
    }
  }

  const handleSync = async (accountId: number) => {
    setSyncing(accountId)
    setMessage(null)
    try {
      const result = await api.teller.syncAccount(accountId)
      setMessage({
        type: 'success',
        text: `Synced ${result.added} new transactions (${result.total} total)`
      })
      loadAccounts()
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to sync transactions'
      })
    } finally {
      setSyncing(null)
    }
  }

  const handleSyncAll = async () => {
    setSyncing(-1)
    setMessage(null)
    try {
      const result = await api.teller.syncAll()
      const totalAdded = result.results.reduce((sum, r) => sum + (r.added || 0), 0)
      setMessage({
        type: 'success',
        text: `Synced ${totalAdded} new transactions across all accounts`
      })
      loadAccounts()
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to sync accounts' })
    } finally {
      setSyncing(null)
    }
  }

  const handleDisconnect = async (accountId: number) => {
    if (!confirm('Are you sure you want to disconnect this account?')) return

    try {
      await api.teller.disconnectAccount(accountId)
      setMessage({ type: 'success', text: 'Account disconnected' })
      loadAccounts()
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to disconnect account' })
    }
  }

  return (
    <div className="card">
      <h2>Connect Your Accounts with Teller</h2>

      {message && (
        <div className={message.type === 'success' ? 'success' : 'error'}>
          {message.text}
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <button
          className="upload-btn"
          onClick={handleConnectClick}
          style={{ marginRight: '1rem' }}
        >
          + Connect New Account
        </button>

        {accounts.length > 0 && (
          <button
            className="upload-btn"
            onClick={handleSyncAll}
            disabled={syncing !== null}
          >
            {syncing === -1 ? 'Syncing All...' : 'Sync All Accounts'}
          </button>
        )}
      </div>

      {showTokenInput && (
        <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f8f9fa', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '1rem' }}>Enter Your Teller Access Token</h3>
          <p style={{ marginBottom: '1rem', color: '#666' }}>
            After connecting your account in the Teller popup, you'll receive an access token. Paste it here:
          </p>
          <input
            type="text"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            placeholder="test_token_..."
            style={{
              width: '100%',
              padding: '0.75rem',
              marginBottom: '1rem',
              border: '2px solid #ddd',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="upload-btn" onClick={handleSaveToken}>
              Save Token
            </button>
            <button
              className="edit-btn"
              onClick={() => {
                setShowTokenInput(false)
                setAccessToken('')
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '2rem', padding: '1rem', background: '#e3f2fd', borderRadius: '8px', border: '1px solid #2196f3' }}>
        <h3 style={{ marginBottom: '0.5rem', color: '#1976d2' }}>How to Connect:</h3>
        <ol style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
          <li>Click "Connect New Account" to open Teller Connect</li>
          <li>Sign up for a free Teller account at <a href="https://teller.io" target="_blank" rel="noopener noreferrer">teller.io</a></li>
          <li>Get your API key from the Teller dashboard</li>
          <li>Use Teller Connect to link your bank (BofA, Chase, Discover, Amex, etc.)</li>
          <li>Copy the access token and paste it above</li>
          <li>Click "Save Token" to connect</li>
        </ol>
        <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#666' }}>
          <strong>Note:</strong> Teller offers 100 free connections for personal use. Your credentials are handled securely by Teller.
        </p>
      </div>

      {accounts.length > 0 && (
        <div>
          <h3 style={{ marginBottom: '1rem' }}>Connected Accounts</h3>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {accounts.map((account) => (
              <div
                key={account.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1.5rem',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #dee2e6'
                }}
              >
                <div>
                  <h4 style={{ marginBottom: '0.25rem' }}>
                    {account.institution_name}
                  </h4>
                  <p style={{ color: '#6c757d', fontSize: '0.875rem' }}>
                    {account.account_name} {account.mask && `••••${account.mask}`}
                  </p>
                  <p style={{ color: '#6c757d', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {account.last_sync
                      ? `Last synced: ${new Date(account.last_sync).toLocaleString()}`
                      : 'Not yet synced'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="edit-btn"
                    onClick={() => handleSync(account.id)}
                    disabled={syncing === account.id}
                  >
                    {syncing === account.id ? 'Syncing...' : 'Sync'}
                  </button>
                  <button
                    className="edit-btn"
                    onClick={() => handleDisconnect(account.id)}
                    style={{ background: '#dc3545' }}
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ConnectAccount
