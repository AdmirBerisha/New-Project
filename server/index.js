import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { simpleParser } from 'mailparser'
import MsgReader from '@kenjiuno/msgreader'
import { parseEmailWithClaude } from './emailParser.js'
import { extractAttachmentText, extractImageAttachments } from './attachmentExtractor.js'

const app = express()
const upload = multer({ storage: multer.memoryStorage() })

app.use(cors())
app.use(express.json({ limit: '10mb' }))

async function extractEmailContent(file) {
  const ext = file.originalname.toLowerCase()

  if (ext.endsWith('.eml')) {
    const parsed = await simpleParser(file.buffer)
    const from = parsed.from?.text || ''
    const to = parsed.to?.text || ''
    const subject = parsed.subject || ''
    const date = parsed.date?.toISOString() || ''
    const body = parsed.text || parsed.html || ''
    const attachments = parsed.attachments || []
    const attachmentText = await extractAttachmentText(attachments)
    const images = extractImageAttachments(attachments)
    const text = `From: ${from}\nTo: ${to}\nSubject: ${subject}\nDate: ${date}\n\n${body}` +
      (attachmentText ? `\n\n--- Attachments ---\n${attachmentText}` : '')
    return { text, images }
  }

  if (ext.endsWith('.msg')) {
    const reader = new MsgReader.default(file.buffer)
    const info = reader.getFileData()
    const from = info.senderEmail || info.senderName || ''
    const subject = info.subject || ''
    const body = info.body || ''
    const rawAttachments = (info.attachments || []).map(att => ({
      filename: att.fileName || '',
      contentType: att.mimeType || '',
      content: Buffer.from(reader.getAttachment(att).content)
    }))
    const attachmentText = await extractAttachmentText(rawAttachments)
    const images = extractImageAttachments(rawAttachments)
    const text = `From: ${from}\nSubject: ${subject}\n\n${body}` +
      (attachmentText ? `\n\n--- Attachments ---\n${attachmentText}` : '')
    return { text, images }
  }

  // Plain text / unknown — decode as UTF-8
  return { text: file.buffer.toString('utf-8'), images: [] }
}

// POST /api/parse — multipart (file) or JSON (plain text)
app.post('/api/parse', upload.single('file'), async (req, res) => {
  try {
    const instructions = req.body.instructions
    if (!instructions || !instructions.trim()) {
      return res.status(400).json({ error: 'Instructions are required.' })
    }

    let emailText, images
    if (req.file) {
      const extracted = await extractEmailContent(req.file)
      emailText = extracted.text
      images = extracted.images
    } else if (req.body.text) {
      emailText = req.body.text
      images = []
    } else {
      return res.status(400).json({ error: 'Provide either a file upload or raw email text.' })
    }

    if (!emailText.trim()) {
      return res.status(400).json({ error: 'Could not extract any text from the provided email.' })
    }

    const result = await parseEmailWithClaude(emailText, instructions, images)
    res.json({ result })
  } catch (err) {
    console.error('Parse error:', err)
    if (err instanceof SyntaxError) {
      return res.status(502).json({ error: 'Claude returned non-JSON output. Try rephrasing your instructions.' })
    }
    res.status(500).json({ error: err.message || 'Internal server error.' })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
