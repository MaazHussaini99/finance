import { useState, useRef, DragEvent } from 'react'
import { api } from '../api'

function Upload() {
  const [file, setFile] = useState<File | null>(null)
  const [institution, setInstitution] = useState('')
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(true)
  }

  const handleDragLeave = () => {
    setDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      setFile(droppedFile)
    } else {
      setMessage({ type: 'error', text: 'Please drop a CSV file' })
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setMessage({ type: 'error', text: 'Please select a file' })
      return
    }

    setUploading(true)
    setMessage(null)

    try {
      const result = await api.transactions.upload(file, institution)
      setMessage({ type: 'success', text: result.message })
      setFile(null)
      setInstitution('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to upload file'
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="card">
      <h2>Upload Transactions</h2>

      {message && (
        <div className={message.type === 'success' ? 'success' : 'error'}>
          {message.text}
        </div>
      )}

      <div
        className={`upload-area ${dragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="upload-icon">📁</div>
        <p>
          {file
            ? `Selected: ${file.name}`
            : 'Drag and drop your CSV file here, or click to browse'}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="file-input"
        />
      </div>

      <div style={{ marginTop: '1rem' }}>
        <label htmlFor="institution" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
          Select Institution (optional - will auto-detect):
        </label>
        <select
          id="institution"
          className="institution-select"
          value={institution}
          onChange={(e) => setInstitution(e.target.value)}
        >
          <option value="">Auto-detect</option>
          <option value="bofa">Bank of America</option>
          <option value="chase">Chase</option>
          <option value="discover">Discover</option>
          <option value="amex">American Express</option>
        </select>
      </div>

      <button
        className="upload-btn"
        onClick={handleUpload}
        disabled={!file || uploading}
      >
        {uploading ? 'Uploading...' : 'Upload and Categorize'}
      </button>

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '1rem' }}>Supported Institutions:</h3>
        <ul style={{ paddingLeft: '1.5rem' }}>
          <li>Bank of America (checking/savings accounts)</li>
          <li>Chase (checking/savings accounts & credit cards)</li>
          <li>Discover (credit cards)</li>
          <li>American Express (credit cards)</li>
        </ul>
        <p style={{ marginTop: '1rem', color: '#666' }}>
          Export your transactions as CSV from your bank/card website and upload them here.
        </p>
      </div>
    </div>
  )
}

export default Upload
