import * as XLSX from 'xlsx'
import OpenAI from 'openai'

const MAX_CHARS = 8000

const EXT_TO_MIME = {
  '.pdf': 'application/pdf',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.xls': 'application/vnd.ms-excel',
  '.csv': 'text/csv',
  '.txt': 'text/plain',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp'
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

function getMimeType(attachment) {
  if (attachment.contentType && !attachment.contentType.startsWith('application/octet-stream')) {
    return attachment.contentType
  }
  const ext = (attachment.filename || '').toLowerCase().match(/\.[^.]+$/)?.[0] || ''
  return EXT_TO_MIME[ext] || attachment.contentType || ''
}

function truncate(text) {
  if (text.length > MAX_CHARS) {
    return text.slice(0, MAX_CHARS) + '\n[...truncated]'
  }
  return text
}

async function extractSingleAttachment(attachment) {
  const mime = getMimeType(attachment)
  const buf = attachment.content

  if (mime === 'application/pdf') {
    const { default: pdfParse } = await import('pdf-parse/lib/pdf-parse.js')
    const data = await pdfParse(buf)
    return truncate(data.text)
  }

  if (
    mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mime === 'application/vnd.ms-excel'
  ) {
    const workbook = XLSX.read(buf, { type: 'buffer' })
    const parts = workbook.SheetNames.map(name => {
      const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[name])
      return `Sheet: ${name}\n${csv}`
    })
    return truncate(parts.join('\n\n'))
  }

  if (mime === 'text/csv' || mime === 'text/plain') {
    return truncate(buf.toString('utf-8'))
  }

  if (mime.startsWith('image/')) {
    const base64 = buf.toString('base64')
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mime};base64,${base64}` }
            },
            {
              type: 'text',
              text: 'Extract all text visible in this image. Return only the extracted text, nothing else.'
            }
          ]
        }
      ]
    })
    return truncate(response.choices[0].message.content.trim())
  }

  return null // skip unknown types
}

export async function extractAttachmentText(attachments) {
  const parts = []
  for (const att of attachments) {
    try {
      const text = await extractSingleAttachment(att)
      if (text) {
        parts.push(`[Attachment: ${att.filename || 'unnamed'}]\n${text}\n[End Attachment: ${att.filename || 'unnamed'}]`)
      }
    } catch (err) {
      parts.push(`[Attachment: ${att.filename || 'unnamed'}]\n[Error extracting content: ${err.message}]\n[End Attachment]`)
    }
  }
  return parts.join('\n\n')
}
