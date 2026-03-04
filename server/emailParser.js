import OpenAI from 'openai'

const client = new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY
})

export async function parseEmailWithClaude(emailText, instructions, images = []) {
  const hasImages = images.length > 0
  const model = hasImages ? 'meta-llama/llama-4-scout-17b-16e-instruct' : 'llama-3.3-70b-versatile'

  let userContent
  if (hasImages) {
    userContent = [
      { type: 'text', text: `Instructions: ${instructions}\n\nEmail:\n${emailText}` },
      ...images.flatMap(img => [
        { type: 'text', text: `\n[Image attachment: ${img.filename}]` },
        { type: 'image_url', image_url: { url: `data:${img.mimeType};base64,${img.base64}` } }
      ])
    ]
  } else {
    userContent = `Instructions: ${instructions}\n\nEmail:\n${emailText}`
  }

  const response = await client.chat.completions.create({
    model,
    max_tokens: 2048,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'You are an expert email analyst. Extract exactly the information specified in the user\'s instructions from the provided email and any attachments. Always respond with valid JSON only — no markdown, no explanation, just the JSON object.'
      },
      {
        role: 'user',
        content: userContent
      }
    ]
  })

  const raw = response.choices[0].message.content.trim()
  return JSON.parse(raw)
}
