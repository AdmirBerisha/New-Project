import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function parseEmailWithClaude(emailText, instructions) {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system:
      'You are an expert email analyst. Extract exactly the information specified in the user\'s instructions from the provided email. Always respond with valid JSON only — no markdown, no explanation, just the JSON object.',
    messages: [
      {
        role: 'user',
        content: `Instructions: ${instructions}\n\nEmail:\n${emailText}`
      }
    ]
  })

  const raw = message.content[0].text.trim()

  // Strip markdown code fences if Claude wraps the JSON
  const jsonText = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()

  return JSON.parse(jsonText)
}
