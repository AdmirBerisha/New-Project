import { useState } from 'react'
import InstructionPanel from './components/InstructionPanel'
import EmailDropZone from './components/EmailDropZone'
import OutputPanel from './components/OutputPanel'

export default function App() {
  const [instructions, setInstructions] = useState('')
  const [emailPayload, setEmailPayload] = useState(null) // { file } or { text }
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleParse() {
    if (!instructions.trim()) {
      setError('Please enter extraction instructions.')
      return
    }
    if (!emailPayload) {
      setError('Please provide an email (drop a file or paste text).')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      let response

      if (emailPayload.file) {
        const formData = new FormData()
        formData.append('file', emailPayload.file)
        formData.append('instructions', instructions)
        response = await fetch('/api/parse', { method: 'POST', body: formData })
      } else {
        response = await fetch('/api/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: emailPayload.text, instructions })
        })
      }

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unknown server error')
      setResult(data.result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Email Parser</h1>
        <p>Set your extraction instructions, drop an email, and get structured data back.</p>
      </header>

      <main className="app-body">
        <InstructionPanel
          instructions={instructions}
          onChange={setInstructions}
          onParse={handleParse}
          loading={loading}
          hasEmail={!!emailPayload}
        />

        <div className="right-panel">
          <EmailDropZone onEmailLoaded={setEmailPayload} emailPayload={emailPayload} />
          <OutputPanel result={result} loading={loading} error={error} />
        </div>
      </main>
    </div>
  )
}
