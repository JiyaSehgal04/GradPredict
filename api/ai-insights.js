const MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant']

function buildPrompt(d) {
  return `You are an expert graduate admissions counselor. Analyse this student profile strictly.

Student profile:
- GRE: ${d.gre}/340
- TOEFL: ${d.toefl}/120
- CGPA: ${d.cgpa}/10
- SOP strength: ${d.sop}/5
- LOR strength: ${d.lor}/5
- Research experience: ${d.research ? 'Yes' : 'No'}
- Target university tier: ${d.rating}/5  (1=regional/easy, 5=elite/hardest)
- Calculated admission probability: ${d.probability}%

Respond with valid JSON in exactly this shape (no markdown, no extra keys):
{
  "overall": "2-3 sentence honest overall profile assessment",
  "work_needed": "Low|Medium|High|Extensive",
  "work_hint": "one short phrase explaining the effort level",
  "strengths": ["strength 1","strength 2","strength 3"],
  "gaps": [
    {"area":"area name","issue":"what is lacking","fix":"specific action to take","time":"realistic timeline e.g. 3-6 months"}
  ],
  "roadmap": "3-4 sentence step-by-step action plan with rough timeline",
  "verdict": "One motivating sentence summarising their realistic outlook"
}`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const key = process.env.GROQ_API_KEY
  if (!key) {
    return res.status(500).json({ error: 'Groq API key not configured on the server.' })
  }

  const d = req.body
  if (!d || typeof d.gre === 'undefined') {
    return res.status(400).json({ error: 'Invalid request body.' })
  }

  const prompt = buildPrompt(d)
  let lastErr = 'No models available.'

  for (const model of MODELS) {
    try {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'You are a helpful assistant that responds only with valid JSON.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.55,
          max_tokens: 1200,
          response_format: { type: 'json_object' },
        }),
      })

      const json = await groqRes.json()

      if (!groqRes.ok) {
        lastErr = json.error?.message || `HTTP ${groqRes.status}`
        continue
      }

      const insights = JSON.parse(json.choices[0].message.content)
      return res.status(200).json(insights)
    } catch (e) {
      lastErr = e.message
    }
  }

  return res.status(502).json({ error: lastErr })
}
