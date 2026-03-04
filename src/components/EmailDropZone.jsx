import { useState, useRef } from 'react'

const ACCEPTED_EXTENSIONS = ['.eml', '.msg', '.txt']

export default function EmailDropZone({ onEmailLoaded, emailPayload }) {
  const [mode, setMode] = useState('drop') // 'drop' | 'paste'
  const [dragging, setDragging] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const fileInputRef = useRef(null)

  function handleFile(file) {
    const name = file.name.toLowerCase()
    const ok = ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext))
    if (!ok) {
      alert(`Unsupported file type. Please use ${ACCEPTED_EXTENSIONS.join(', ')}`)
      return
    }
    onEmailLoaded({ file, fileName: file.name })
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function onDragOver(e) {
    e.preventDefault()
    setDragging(true)
  }

  function onDragLeave() {
    setDragging(false)
  }

  function onFileInputChange(e) {
    const file = e.target.files[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  function applyPasteText() {
    if (pasteText.trim()) {
      onEmailLoaded({ text: pasteText })
    }
  }

  function clearEmail() {
    onEmailLoaded(null)
    setPasteText('')
  }

  const hasEmail = !!emailPayload

  return (
    <section className="email-section">
      <div className="section-header">
        <h2>Email Input</h2>
        <div className="mode-tabs">
          <button
            className={`tab-btn ${mode === 'drop' ? 'active' : ''}`}
            onClick={() => setMode('drop')}
          >
            Drop / Upload
          </button>
          <button
            className={`tab-btn ${mode === 'paste' ? 'active' : ''}`}
            onClick={() => setMode('paste')}
          >
            Paste Text
          </button>
        </div>
      </div>

      {mode === 'drop' && (
        <div
          className={`drop-zone ${dragging ? 'dragging' : ''} ${hasEmail && emailPayload.file ? 'has-file' : ''}`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => !hasEmail && fileInputRef.current.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".eml,.msg,.txt"
            style={{ display: 'none' }}
            onChange={onFileInputChange}
          />
          {hasEmail && emailPayload.file ? (
            <div className="file-loaded">
              <span className="file-icon">📧</span>
              <span className="file-name">{emailPayload.fileName}</span>
              <button className="clear-btn" onClick={(e) => { e.stopPropagation(); clearEmail() }}>Remove</button>
            </div>
          ) : (
            <div className="drop-prompt">
              <span className="drop-icon">⬇</span>
              <p>Drag & drop an email file here</p>
              <p className="drop-sub">Supports .eml, .msg, .txt — or click to browse</p>
            </div>
          )}
        </div>
      )}

      {mode === 'paste' && (
        <div className="paste-zone">
          <textarea
            className="paste-textarea"
            placeholder="Paste raw email content here (headers + body)…"
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={8}
          />
          <div className="paste-actions">
            {hasEmail && emailPayload.text && (
              <span className="email-loaded-badge">✓ Email loaded</span>
            )}
            <button
              className="apply-btn"
              onClick={applyPasteText}
              disabled={!pasteText.trim()}
            >
              Use This Email
            </button>
            {hasEmail && (
              <button className="clear-btn" onClick={clearEmail}>Clear</button>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
