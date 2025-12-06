import { useState, useEffect } from 'react'
import { api } from '../api'

// Declare TellerConnect global type
declare global {
  interface Window {
    TellerConnect: {
      setup: (config: TellerConnectConfig) => TellerConnectInstance
    }
  }
}

interface TellerConnectConfig {
  applicationId: string
  environment?: 'sandbox' | 'development' | 'production'
  products: string[]
  onSuccess: (enrollment: { accessToken: string; enrollment: any; user: any }) => void
  onExit?: () => void
  onInit?: () => void
}

interface TellerConnectInstance {
  open: () => void
  close: () => void
}

interface ConnectAccountProps {
  onSuccess?: () => void
}

function ConnectAccount({ onSuccess }: ConnectAccountProps) {
  const [accounts, setAccounts] = useState<any[]>([])
  const [syncing, setSyncing] = useState<number | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [tellerConnect, setTellerConnect] = useState<TellerConnectInstance | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    loadAccounts()
    initializeTellerConnect()
  }, [])

  const loadAccounts = async () => {
    try {
      const data = await api.teller.getAccounts()
      setAccounts(data)
    } catch (error) {
      console.error('Error loading accounts:', error)
    }
  }

  const initializeTellerConnect = () => {
    // Wait for TellerConnect library to load
    const checkTellerConnect = setInterval(() => {
      if (window.TellerConnect) {
        clearInterval(checkTellerConnect)

        try {
          const tc = window.TellerConnect.setup({
            applicationId: 'app_plt7tkg920bf7jh9ba000',
            environment: 'production', // Use production for real bank accounts
            products: ['transactions', 'balance', 'identity'],
            onSuccess: async (enrollment) => {
              console.log('Teller Connect successful:', enrollment)
              setIsConnecting(true)
              setMessage({ type: 'success', text: 'Connecting account...' })

              try {
                await api.teller.saveEnrollment(enrollment.accessToken)
                setMessage({ type: 'success', text: 'Account connected successfully!' })
                await loadAccounts()
                onSuccess?.()
              } catch (error: any) {
                console.error('Error saving enrollment:', error)
                setMessage({
                  type: 'error',
                  text: error.response?.data?.error || 'Failed to save account connection'
                })
              } finally {
                setIsConnecting(false)
              }
            },
            onExit: () => {
              console.log('User closed Teller Connect')
              setIsConnecting(false)
            },
            onInit: () => {
              console.log('Teller Connect initialized')
            }
          })

          setTellerConnect(tc)
        } catch (error) {
          console.error('Error initializing Teller Connect:', error)
          setMessage({
            type: 'error',
            text: 'Failed to initialize Teller Connect. Please refresh the page.'
          })
        }
      }
    }, 100)

    // Clear interval after 10 seconds if TellerConnect doesn't load
    setTimeout(() => clearInterval(checkTellerConnect), 10000)
  }

  const handleConnectClick = () => {
    if (tellerConnect) {
      setMessage(null)
      tellerConnect.open()
    } else {
      setMessage({
        type: 'error',
        text: 'Teller Connect is not ready. Please refresh the page.'
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
          disabled={isConnecting || !tellerConnect}
        >
          {isConnecting ? 'Connecting...' : '+ Connect New Account'}
        </button>

        {accounts.length > 0 && (
          <button
            className="upload-btn"
            onClick={handleSyncAll}
            disabled={syncing !== null || isConnecting}
          >
            {syncing === -1 ? 'Syncing All...' : 'Sync All Accounts'}
          </button>
        )}
      </div>

      <div style={{ marginBottom: '2rem', padding: '1rem', background: '#e3f2fd', borderRadius: '8px', border: '1px solid #2196f3' }}>
        <h3 style={{ marginBottom: '0.5rem', color: '#1976d2' }}>How to Connect (Production Mode):</h3>
        <ol style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
          <li>Click <strong>"+ Connect New Account"</strong> button above</li>
          <li>Teller Connect window will open</li>
          <li>Search for your bank (Bank of America, Chase, Discover, Amex, etc.)</li>
          <li><strong>Login with your REAL bank credentials</strong> (handled securely by Teller)</li>
          <li>Complete any multi-factor authentication if required</li>
          <li>Select which accounts to share (or all accounts will be connected automatically)</li>
          <li>Your account will connect automatically and transactions will sync!</li>
        </ol>
        <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#666' }}>
          <strong>Security:</strong> Your bank credentials are NEVER stored in this app. Teller handles all authentication using bank-level 256-bit encryption. Only an access token is stored locally. This app runs entirely on your machine.
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
