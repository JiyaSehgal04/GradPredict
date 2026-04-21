const MODELS = ['gpt-4o-mini', 'gpt-3.5-turbo']

export async function fetchGeminiInsights(d) {
  const key = import.meta.env.VITE_OPENAI_KEY
  if (!key) throw new Error('OpenAI API key not configured (VITE_OPENAI_KEY missing).')

  const prompt = `You are an expert graduate admissions counselor. Analyse this student profile strictly.

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

  let lastErr = 'No models available.'

  for (const model of MODELS) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
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

      const json = await res.json()

      if (!res.ok) {
        lastErr = json.error?.message || `HTTP ${res.status}`
        console.error(`[AI] ${model} → ${res.status}:`, json.error)
        continue
      }

      return JSON.parse(json.choices[0].message.content)
    } catch (e) {
      lastErr = e.message
      console.error(`[AI] ${model} fetch error:`, e)
    }
  }

  throw new Error(lastErr)
}
