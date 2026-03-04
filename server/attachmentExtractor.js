import * as XLSX from 'xlsx'

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

  return null // skip unknown types
}

export async function extractAttachmentText(attachments) {
  const parts = []
  for (const att of attachments) {
    const mime = getMimeType(att)
    if (mime.startsWith('image/')) continue // handled separately
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

export function extractImageAttachments(attachments) {
  return attachments
    .filter(att => getMimeType(att).startsWith('image/'))
    .map(att => ({
      filename: att.filename || 'image',
      base64: att.content.toString('base64'),
      mimeType: getMimeType(att)
    }))
}
