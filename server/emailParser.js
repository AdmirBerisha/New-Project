import OpenAI from 'openai'

const client = new OpenAI()

export async function parseEmailWithClaude(emailText, instructions) {
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
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
