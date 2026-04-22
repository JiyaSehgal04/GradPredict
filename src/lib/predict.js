const ML_API = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:5050'

export async function calcProb(data, ratingOverride) {
  const rating = ratingOverride ?? data.rating
  try {
    const resp = await fetch(`${ML_API}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gre: data.gre, toefl: data.toefl, rating,
        sop: data.sop, lor: data.lor,
        gpa: data.cgpa, research: data.research ? 1 : 0,
      }),
    })
    if (!resp.ok) throw new Error(`API ${resp.status}`)
    const result = await resp.json()
    return Math.round(result.probability)
  } catch {
    // Fallback formula when backend is not running
    let score = 0
    score += Math.max(0, Math.min(25, ((data.gre - 260) / 80) * 25))
    score += Math.max(0, Math.min(15, ((data.toefl - 80) / 40) * 15))
    score += Math.max(0, Math.min(25, ((data.cgpa - 5) / 5) * 25))
    score += Math.max(0, Math.min(10, ((data.sop - 1) / 4) * 10))
    score += Math.max(0, Math.min(10, ((data.lor - 1) / 4) * 10))
    score += data.research ? 10 : 0
    score += (3 - rating) * 2.5
    return Math.max(5, Math.min(99, Math.round(score)))
  }
}

export const TIERS = [
  { rating: 1, name: 'Safety Schools',  desc: 'Regional & state universities',  recommend: 'Apply — very strong chance' },
  { rating: 2, name: 'Likely Schools',  desc: 'Good national universities',      recommend: 'Apply with confidence' },
  { rating: 3, name: 'Match Schools',   desc: 'Competitive programs',            recommend: 'Solid target range' },
  { rating: 4, name: 'Reach Schools',   desc: 'Selective programs',              recommend: 'Apply, but have backups' },
  { rating: 5, name: 'Stretch Schools', desc: 'Elite / top-tier programs',       recommend: 'Low odds — worth a shot' },
]

export function getRiskStyle(prob) {
  if (prob >= 75) return { label: 'LOW RISK',    badge: 'bg-green-100 text-green-800',   bar: 'bg-green-500' }
  if (prob >= 50) return { label: 'MEDIUM RISK', badge: 'bg-yellow-100 text-yellow-800', bar: 'bg-yellow-500' }
  return           { label: 'HIGH RISK',    badge: 'bg-red-100 text-red-700',      bar: 'bg-red-500' }
}
