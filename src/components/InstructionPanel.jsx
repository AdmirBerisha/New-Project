const PRESETS = [
  {
    label: 'Action Items',
    text: 'Extract all action items and tasks mentioned in the email. For each item include: description, assigned_to (if mentioned), due_date (if mentioned).'
  },
  {
    label: 'Key Contacts',
    text: 'Extract all people mentioned in the email. For each person include: name, email, role or title (if mentioned), and their relation to the email (sender, recipient, mentioned).'
  },
  {
    label: 'Meeting Summary',
    text: 'Extract: subject, date_and_time, location_or_link, organizer, attendees (list), agenda_items (list), decisions_made (list), and next_steps (list).'
  },
  {
    label: 'Sentiment & Urgency',
    text: 'Analyze the email and extract: overall_sentiment (positive/neutral/negative), urgency_level (low/medium/high/critical), tone, key_concerns (list), and a brief summary.'
  }
]

export default function InstructionPanel({ instructions, onChange, onParse, loading, hasEmail }) {
  return (
    <aside className="instruction-panel">
      <h2>Extraction Instructions</h2>
      <p className="hint">Describe what information you want to extract from the email. Claude will return it as structured JSON.</p>

      <div className="presets">
        <span className="presets-label">Presets:</span>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            className="preset-btn"
            onClick={() => onChange(p.text)}
            title={p.text}
          >
            {p.label}
          </button>
        ))}
      </div>

      <textarea
        className="instruction-textarea"
        placeholder="e.g. Extract the sender, subject, date, and all action items as a list."
        value={instructions}
        onChange={(e) => onChange(e.target.value)}
        rows={12}
      />

      <button
        className="parse-btn"
        onClick={onParse}
        disabled={loading || !instructions.trim() || !hasEmail}
      >
        {loading ? 'Parsing…' : 'Parse Email'}
      </button>
    </aside>
  )
}
