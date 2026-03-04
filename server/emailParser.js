import OpenAI from 'openai'

const client = new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY
})

export async function parseEmailWithClaude(emailText, instructions) {
  const response = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 2048,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'You are an expert email analyst. Extract exactly the information specified in the user\'s instructions from the provided email and any attachments. Always respond with valid JSON only — no markdown, no explanation, just the JSON object.'
      },
      {
        role: 'user',
        content: `Instructions: ${instructions}\n\nEmail:\n${emailText}`
      }
    ]
  })

  const raw = response.choices[0].message.content.trim()
  return JSON.parse(raw)
}
