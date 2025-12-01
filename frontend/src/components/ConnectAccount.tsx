import { useState, useEffect, useCallback } from 'react'
import { usePlaidLink } from 'react-plaid-link'
import { api } from '../api'

interface ConnectAccountProps {
  onSuccess?: () => void
}

function ConnectAccount({ onSuccess }: ConnectAccountProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [accounts, setAccounts] = useState<any[]>([])
  const [syncing, setSyncing] = useState<number | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    createLinkToken()
    loadAccounts()
  }, [])

  const createLinkToken = async () => {
    try {
      const data = await api.plaid.createLinkToken()
      setLinkToken(data.link_token)
    } catch (error) {
      console.error('Error creating link token:', error)
      setMessage({ type: 'error', text: 'Failed to initialize Plaid. Check your API credentials.' })
    }
  }

  const loadAccounts = async () => {
    try {
      const data = await api.plaid.getAccounts()
      setAccounts(data)
    } catch (error) {
      console.error('Error loading accounts:', error)
    }
  }

  const onPlaidSuccess = useCallback(async (public_token: string) => {
    try {
      await api.plaid.exchangePublicToken(public_token)
      setMessage({ type: 'success', text: 'Account connected successfully!' })
      loadAccounts()
      onSuccess?.()
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to connect account' })
    }
  }, [onSuccess])

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: onPlaidSuccess,
  })

  const handleSync = async (accountId: number) => {
    setSyncing(accountId)
    setMessage(null)
    try {
      const result = await api.plaid.syncAccount(accountId)
      setMessage({
        type: 'success',
        text: `Synced ${result.added} new transactions`
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
      const result = await api.plaid.syncAll()
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
      await api.plaid.disconnectAccount(accountId)
      setMessage({ type: 'success', text: 'Account disconnected' })
      loadAccounts()
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to disconnect account' })
    }
  }

  return (
    <div className="card">
      <h2>Connect Your Accounts</h2>

      {message && (
        <div className={message.type === 'success' ? 'success' : 'error'}>
          {message.text}
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <button
          className="upload-btn"
          onClick={() => open()}
          disabled={!ready}
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

      <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>How it works:</h3>
        <ol style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
          <li>Click "Connect New Account" to securely link your bank or credit card</li>
          <li>Login with your bank credentials (handled securely by Plaid)</li>
          <li>Select which accounts to connect</li>
          <li>Transactions will be automatically synced every 6 hours</li>
          <li>Manual sync is also available anytime</li>
        </ol>
        <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#666' }}>
          <strong>Supported:</strong> Bank of America, Chase, Discover, American Express, and 11,000+ other institutions
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
