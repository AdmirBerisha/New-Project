import { useState } from 'react'

function escapeCell(value) {
  const str = (value === null || value === undefined)
    ? ''
    : (typeof value === 'object' ? JSON.stringify(value) : String(value))
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

function convertToCSV(result) {
  if (Array.isArray(result) && result.length > 0 && typeof result[0] === 'object') {
    const keys = [...new Set(result.flatMap((r) => Object.keys(r)))]
    const header = keys.map(escapeCell).join(',')
    const rows = result.map((row) => keys.map((k) => escapeCell(row[k])).join(','))
    return [header, ...rows].join('\r\n')
  }
  if (typeof result === 'object' && !Array.isArray(result)) {
    const keys = Object.keys(result)
    const header = keys.map(escapeCell).join(',')
    const row = keys.map((k) => escapeCell(result[k])).join(',')
    return [header, row].join('\r\n')
  }
  // Fallback: single-column list
  return ['value', ...(Array.isArray(result) ? result : [result]).map(escapeCell)].join('\r\n')
}

function renderValue(value, depth = 0) {
  if (value === null || value === undefined) return <span className="val-null">null</span>
  if (typeof value === 'boolean') return <span className="val-bool">{value.toString()}</span>
  if (typeof value === 'number') return <span className="val-num">{value}</span>
  if (typeof value === 'string') return <span className="val-str">{value}</span>

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="val-empty">[ ]</span>
    return (
      <ul className="val-list">
        {value.map((item, i) => (
          <li key={i}>{renderValue(item, depth + 1)}</li>
        ))}
      </ul>
    )
  }

  if (typeof value === 'object') {
    return (
      <div className={`val-obj ${depth > 0 ? 'nested' : ''}`}>
        {Object.entries(value).map(([k, v]) => (
          <div className="obj-row" key={k}>
            <span className="obj-key">{k}</span>
            <span className="obj-val">{renderValue(v, depth + 1)}</span>
          </div>
        ))}
      </div>
    )
  }

  return <span>{String(value)}</span>
}

export default function OutputPanel({ result, loading, error }) {
  const [copied, setCopied] = useState(false)

  function copyJSON() {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function downloadCSV() {
    const csv = convertToCSV(result)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'extracted-data.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="output-panel">
      <div className="section-header">
        <h2>Extracted Data</h2>
        {result && (
          <div className="output-actions">
            <button className="copy-btn" onClick={copyJSON}>
              {copied ? '✓ Copied!' : 'Copy JSON'}
            </button>
            <button className="download-btn" onClick={downloadCSV}>
              Download CSV
            </button>
          </div>
        )}
      </div>

      {loading && (
        <div className="output-state">
          <div className="spinner" />
          <p>Analyzing email with Claude…</p>
        </div>
      )}

      {error && !loading && (
        <div className="output-state error">
          <p className="error-icon">⚠</p>
          <p>{error}</p>
        </div>
      )}

      {result && !loading && (
        <div className="result-view">
          {renderValue(result)}
        </div>
      )}

      {!result && !loading && !error && (
        <div className="output-state empty">
          <p>Results will appear here after parsing.</p>
        </div>
      )}
    </section>
  )
}
