import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Cell, Tooltip, LabelList,
} from 'recharts'
import { calcProb, TIERS, getRiskStyle } from '../lib/predict'
import { fetchGeminiInsights } from '../lib/gemini'

function DonutChart({ value }) {
  const size = 280
  const strokeWidth = 22
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const dash = (value / 100) * circumference
  const cx = size / 2

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
        {/* Arc */}
        <circle
          cx={cx} cy={cx} r={r} fill="none"
          stroke="#c2940a" strokeWidth={strokeWidth}
          strokeLinecap="butt"
          strokeDasharray={`${dash} ${circumference}`}
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
        {/* Tick marks */}
        {[0,25,50,75].map(tick => {
          const angle = (tick / 100) * 2 * Math.PI
          const x1 = cx + (r - strokeWidth / 2 - 4) * Math.cos(angle)
          const y1 = cx + (r - strokeWidth / 2 - 4) * Math.sin(angle)
          const x2 = cx + (r + strokeWidth / 2 + 4) * Math.cos(angle)
          const y2 = cx + (r + strokeWidth / 2 + 4) * Math.sin(angle)
          return <line key={tick} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#221e10" strokeWidth={2} />
        })}
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ transform: 'rotate(0deg)' }}>
        <span className="text-7xl font-extrabold leading-none">{value}<span className="text-3xl">%</span></span>
        <span className="font-bold text-primary text-base uppercase tracking-widest mt-1">Probability</span>
      </div>
    </div>
  )
}

const WORK_STYLES = {
  Low:       { bg: 'bg-green-500',  text: 'text-green-400' },
  Medium:    { bg: 'bg-yellow-500', text: 'text-yellow-400' },
  High:      { bg: 'bg-orange-500', text: 'text-orange-400' },
  Extensive: { bg: 'bg-red-500',    text: 'text-red-400' },
}

export default function Results() {
  const [data, setData] = useState(null)
  const [tierProbs, setTierProbs] = useState({})
  const [aiInsights, setAiInsights] = useState(null)
  const [aiLoading, setAiLoading] = useState(true)
  const [aiError, setAiError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const raw = localStorage.getItem('admitPredict_result')
    if (!raw) {
      setTimeout(() => navigate('/predict'), 2500)
      return
    }
    const d = JSON.parse(raw)
    setData(d)
    loadAI(d)
    Promise.all(TIERS.map(tier => calcProb(d, tier.rating))).then(probs => {
      const map = {}
      TIERS.forEach((tier, i) => { map[tier.rating] = probs[i] })
      setTierProbs(map)
    })
  }, [navigate])

  async function loadAI(d) {
    setAiLoading(true)
    setAiError('')
    setAiInsights(null)
    try {
      const insights = await fetchGeminiInsights(d)
      setAiInsights(insights)
    } catch (err) {
      setAiError(err.message || 'Unexpected error.')
    } finally {
      setAiLoading(false)
    }
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light">
        <p className="font-bold text-xl">No prediction data found. Redirecting…</p>
      </div>
    )
  }

  const p = data.probability
  const user = JSON.parse(localStorage.getItem('admitPredict_user') || 'null')

  let riskLabel, riskColor, riskIcon
  if (p >= 75)      { riskLabel = 'Risk Level: Low';    riskColor = 'text-green-400';  riskIcon = 'shield' }
  else if (p >= 50) { riskLabel = 'Risk Level: Medium'; riskColor = 'text-yellow-400'; riskIcon = 'warning' }
  else              { riskLabel = 'Risk Level: High';   riskColor = 'text-red-400';    riskIcon = 'cancel' }

  const breakdownItems = [
    {
      tag: 'GPA', title: 'Academic Performance',
      desc: data.cgpa >= 8.5
        ? `Your CGPA of ${data.cgpa} is well above average, adding a strong boost to your probability score.`
        : data.cgpa >= 7.0
        ? `Your CGPA of ${data.cgpa} is competitive for most graduate programs.`
        : `Your CGPA of ${data.cgpa} may limit acceptance at highly selective programs. Consider taking additional courses.`,
      highlight: data.cgpa >= 8.0,
    },
    {
      tag: 'GRE', title: 'Standardized Testing',
      desc: data.gre >= 325
        ? `Your GRE score of ${data.gre} places you in the top tier of applicants for most programs.`
        : data.gre >= 310
        ? `Your GRE score of ${data.gre} is solid. Improving by 5–10 points could open more options.`
        : `Your GRE score of ${data.gre} is below the median for many top programs. Consider retaking.`,
      highlight: data.gre >= 320,
    },
    {
      tag: 'LOR', title: 'Letter of Recommendation',
      desc: data.lor >= 4
        ? `Strong LOR rating of ${data.lor}/5 gives admissions committees confidence in your potential.`
        : `LOR rating of ${data.lor}/5. Getting stronger recommendations could significantly improve your application.`,
      highlight: data.lor >= 4,
    },
    {
      tag: 'RES', title: 'Research Experience',
      desc: data.research
        ? 'Published research puts you in the top percentile of applicants for research-oriented programs.'
        : 'No research experience noted. Consider joining a lab or contributing to a project before applying.',
      highlight: data.research,
    },
  ]

  const radarData = [
    { metric: 'GRE',      value: Math.round(((data.gre - 260) / 80) * 100) },
    { metric: 'TOEFL',    value: Math.round((data.toefl / 120) * 100) },
    { metric: 'CGPA',     value: Math.round((data.cgpa / 10) * 100) },
    { metric: 'SOP',      value: Math.round((data.sop / 5) * 100) },
    { metric: 'LOR',      value: Math.round((data.lor / 5) * 100) },
    { metric: 'Research', value: data.research ? 100 : 0 },
  ]

  const barData = [
    { label: 'GRE',   pct: Math.round(((data.gre - 260) / 80) * 100),  display: data.gre },
    { label: 'TOEFL', pct: Math.round((data.toefl / 120) * 100),        display: data.toefl },
    { label: 'CGPA',  pct: Math.round((data.cgpa / 10) * 100),          display: data.cgpa.toFixed(1) },
    { label: 'SOP',   pct: Math.round((data.sop / 5) * 100),            display: data.sop.toFixed(1) },
    { label: 'LOR',   pct: Math.round((data.lor / 5) * 100),            display: data.lor.toFixed(1) },
  ]

  const tierChartData = TIERS.map(tier => {
    const prob = tierProbs[tier.rating] ?? 0
    const rs = getRiskStyle(prob)
    return { name: tier.name, prob, risk: rs.label, isCurrent: tier.rating === data.rating }
  })

  return (
    <div className="bg-background-light font-display text-zinc-900 min-h-screen">
      {/* Nav */}
      <nav className="border-b-4 border-black bg-white p-4 sticky top-0 z-50 no-print">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-primary border-2 border-black p-1"><span className="material-icons text-white">school</span></div>
            <span className="font-extrabold text-xl tracking-tighter uppercase">AdmitPredict</span>
          </div>
          <div className="flex items-center gap-4 font-semibold flex-wrap">
            <Link className="hover:text-primary underline decoration-2 underline-offset-4 no-print" to="/dashboard">Dashboard</Link>
            <Link className="hover:text-primary underline decoration-2 underline-offset-4 no-print" to="/predict">New Prediction</Link>
            <button onClick={() => window.print()} className="no-print flex items-center gap-1 bg-black text-white border-2 border-black px-4 py-1 neobrutal-shadow-sm font-bold neobrutal-button">
              <span className="material-icons text-sm">download</span> Report
            </button>
            <Link to="/" className="bg-primary text-white border-2 border-black px-4 py-1 neobrutal-shadow-sm font-bold neobrutal-button no-print">HOME</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto py-12 px-6">
        {/* Print header */}
        <div className="print-header mb-8 pb-6 border-b-4 border-black">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary border-2 border-black p-1"><span className="material-icons text-white">school</span></div>
            <span className="font-extrabold text-2xl tracking-tighter uppercase">AdmitPredict — Admission Report</span>
          </div>
          <p className="text-sm text-zinc-500">Generated: {new Date().toLocaleString()}</p>
          {user && <p className="text-sm text-zinc-500">Student: {user.name} ({user.email})</p>}
        </div>

        <header className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-extrabold uppercase tracking-tighter mb-4">Your Outlook</h1>
          <p className="text-xl font-medium bg-primary/20 inline-block px-4 py-1 border-black-thin">Analysis complete based on your academic profile.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Probability donut */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <DonutChart value={p} />
            <div className="bg-black text-white px-8 py-3 rounded-sm flex items-center gap-3 neobrutal-shadow-sm mt-6">
              <span className={`material-icons ${riskColor}`}>{riskIcon}</span>
              <span className="font-extrabold text-2xl uppercase italic">{riskLabel}</span>
            </div>
          </div>

          {/* Breakdown */}
          <div className="lg:col-span-7 space-y-8">
            <section className="bg-white border-black-thick p-8 neobrutal-shadow">
              <h2 className="text-3xl font-extrabold uppercase mb-6 flex items-center gap-3">
                <span className="bg-primary p-1 text-white border-2 border-black"><span className="material-icons">query_stats</span></span>
                Why this score?
              </h2>
              <div className="space-y-6">
                {breakdownItems.map(item => (
                  <div key={item.tag} className={`flex gap-4 items-start ${!item.highlight ? 'opacity-70' : ''}`}>
                    <div className={`${item.highlight ? 'bg-primary' : 'bg-zinc-300'} text-black font-extrabold p-2 border-black-thin shrink-0`}>{item.tag}</div>
                    <div>
                      <h3 className="font-extrabold text-xl uppercase">{item.title}</h3>
                      <p className="text-zinc-600 font-medium">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-primary text-white border-black-thick p-6 neobrutal-shadow relative overflow-hidden group">
                <div className="relative z-10">
                  <h3 className="font-extrabold text-2xl uppercase mb-2">Your Dashboard</h3>
                  <p className="font-medium mb-4">View all your past predictions and track your progress over time.</p>
                  <Link to="/dashboard" className="inline-block bg-white text-black border-2 border-black px-4 py-2 font-extrabold uppercase neobrutal-shadow-sm neobrutal-button">Explore</Link>
                </div>
                <span className="material-icons absolute -bottom-4 -right-4 text-white/20 text-9xl group-hover:rotate-12 transition-transform">domain</span>
              </div>
              <div className="bg-white border-black-thick p-6 neobrutal-shadow relative overflow-hidden group">
                <div className="relative z-10">
                  <h3 className="font-extrabold text-2xl uppercase mb-2">Improve Score</h3>
                  <p className="font-medium mb-4">Re-enter your details with updated scores to see how changes affect your probability.</p>
                  <Link to="/predict" className="inline-block bg-primary text-white border-2 border-black px-4 py-2 font-extrabold uppercase neobrutal-shadow-sm neobrutal-button">Retake</Link>
                </div>
                <span className="material-icons absolute -bottom-4 -right-4 text-black/10 text-9xl group-hover:rotate-12 transition-transform">edit_note</span>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics charts */}
        <section className="mt-20">
          <h2 className="text-3xl font-extrabold uppercase mb-10 text-center">Detailed Metric Comparison</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Radar chart */}
            <div className="bg-white border-black-thick neobrutal-shadow p-6">
              <h3 className="font-extrabold uppercase mb-4 text-center tracking-widest text-sm text-zinc-500">Profile Radar</h3>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                  <PolarGrid stroke="#221e10" strokeOpacity={0.15} />
                  <PolarAngleAxis dataKey="metric" tick={{ fontFamily: 'Lexend', fontWeight: 800, fontSize: 11, fill: '#221e10', textTransform: 'uppercase' }} />
                  <Radar name="You" dataKey="value" stroke="#c2940a" fill="#c2940a" fillOpacity={0.25} strokeWidth={2} dot={{ r: 4, fill: '#c2940a', strokeWidth: 0 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Bar chart */}
            <div className="bg-white border-black-thick neobrutal-shadow p-6">
              <h3 className="font-extrabold uppercase mb-4 text-center tracking-widest text-sm text-zinc-500">Score vs Max</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData} barCategoryGap="30%" margin={{ top: 20, right: 10, bottom: 5, left: -10 }}>
                  <XAxis dataKey="label" tick={{ fontFamily: 'Lexend', fontWeight: 800, fontSize: 11, fill: '#221e10' }} axisLine={{ stroke: '#221e10' }} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ fill: '#c2940a22' }}
                    contentStyle={{ border: '2px solid #221e10', borderRadius: 0, fontFamily: 'Lexend', fontWeight: 700 }}
                    formatter={(_v, _n, props) => [`${props.payload.display}`, props.payload.label]}
                  />
                  <Bar dataKey="pct" radius={0} maxBarSize={52}>
                    {barData.map((entry) => (
                      <Cell key={entry.label} fill={entry.pct >= 80 ? '#c2940a' : entry.pct >= 55 ? '#221e10' : '#ef4444'} />
                    ))}
                    <LabelList dataKey="display" position="top" style={{ fontFamily: 'Lexend', fontWeight: 800, fontSize: 13, fill: '#221e10' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* University Tier Comparison */}
        <section className="mt-20 no-print">
          <h2 className="text-3xl font-extrabold uppercase mb-3 text-center">University Tier Comparison</h2>
          <p className="text-center text-xs font-bold text-zinc-500 uppercase tracking-widest mb-10">Same profile · Different selectivity levels — shortlist your best options</p>
          <div className="bg-white border-black-thick neobrutal-shadow p-6">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                layout="vertical"
                data={tierChartData}
                margin={{ top: 0, right: 60, bottom: 0, left: 10 }}
                barCategoryGap="25%"
              >
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis
                  type="category" dataKey="name" width={120}
                  tick={{ fontFamily: 'Lexend', fontWeight: 800, fontSize: 12, fill: '#221e10' }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: '#c2940a18' }}
                  contentStyle={{ border: '2px solid #221e10', borderRadius: 0, fontFamily: 'Lexend', fontWeight: 700 }}
                  formatter={(v, _, props) => [`${v}%  —  ${props.payload.risk}`, props.payload.name]}
                />
                <Bar dataKey="prob" radius={0} maxBarSize={28}>
                  {tierChartData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={entry.isCurrent ? '#c2940a' : entry.prob >= 75 ? '#221e10' : entry.prob >= 50 ? '#6b7280' : '#d1d5db'}
                      stroke="#221e10" strokeWidth={entry.isCurrent ? 2 : 0}
                    />
                  ))}
                  <LabelList dataKey="prob" position="right"
                    formatter={v => `${v}%`}
                    style={{ fontFamily: 'Lexend', fontWeight: 800, fontSize: 13, fill: '#221e10' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-6 mt-4 justify-center flex-wrap">
              <span className="flex items-center gap-2 text-xs font-bold uppercase"><span className="w-4 h-4 bg-primary border border-black inline-block" />Your selection</span>
              <span className="flex items-center gap-2 text-xs font-bold uppercase"><span className="w-4 h-4 bg-[#221e10] inline-block" />Strong match</span>
              <span className="flex items-center gap-2 text-xs font-bold uppercase"><span className="w-4 h-4 bg-gray-400 inline-block" />Moderate</span>
              <span className="flex items-center gap-2 text-xs font-bold uppercase"><span className="w-4 h-4 bg-gray-200 border border-gray-300 inline-block" />Low chance</span>
            </div>
          </div>
        </section>

        {/* University Tier Comparison — print */}
        <section className="mt-8 print-header">
          <h2 className="text-xl font-extrabold uppercase mb-4">University Tier Comparison</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-black text-white">
                {['Tier','Category','Probability','Risk','Recommendation'].map(h => (
                  <th key={h} className="p-2 text-left font-extrabold uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIERS.map(tier => {
                const prob = tierProbs[tier.rating] ?? '…'
                const rs = getRiskStyle(prob)
                const isCurrent = tier.rating === data.rating
                return (
                  <tr key={tier.rating} style={{ borderBottom: '1px solid #ccc', background: isCurrent ? '#fef9e7' : 'white' }}>
                    <td className="p-2 font-bold">{tier.rating}</td>
                    <td className="p-2">{tier.name}</td>
                    <td className="p-2 font-extrabold">{prob}%</td>
                    <td className="p-2">{rs.label}</td>
                    <td className="p-2">{tier.recommend}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>

        {/* AI Counselor */}
        <section className="mt-20 no-print">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-primary border-2 border-black flex items-center justify-center flex-shrink-0">
              <span className="material-icons text-white text-2xl">auto_awesome</span>
            </div>
            <div>
              <h2 className="text-3xl font-extrabold uppercase leading-none">AI Counselor Insights</h2>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Personalised analysis · Powered by Groq</p>
            </div>
            {aiError && (
              <button onClick={() => loadAI(data)} className="ml-auto flex items-center gap-1 border-black-thick px-4 py-2 font-extrabold uppercase text-sm neobrutal-shadow-sm bg-white hover:bg-primary hover:text-white transition-colors">
                <span className="material-icons text-sm">refresh</span> Retry
              </button>
            )}
          </div>

          {aiLoading && (
            <div className="bg-zinc-900 text-white border-black-thick p-10 neobrutal-shadow text-center">
              <div className="inline-flex flex-col items-center gap-4">
                <span className="material-icons text-primary text-5xl spin-slow">autorenew</span>
                <p className="font-extrabold uppercase tracking-widest text-sm text-white/60">Analysing your profile with Groq…</p>
              </div>
            </div>
          )}

          {aiError && !aiLoading && (
            <div className="bg-red-50 border-black-thick p-8 neobrutal-shadow-sm text-center">
              <span className="material-icons text-red-500 text-4xl mb-3 block">cloud_off</span>
              <p className="font-extrabold uppercase text-red-600 mb-2">Could not reach Groq</p>
              <p className="text-sm text-red-400 font-medium">{aiError}</p>
            </div>
          )}

          {aiInsights && !aiLoading && (
            <div className="space-y-6">
              {/* Overall + effort */}
              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-zinc-900 text-white border-black-thick p-8 neobrutal-shadow">
                  <p className="text-xs font-extrabold uppercase text-primary tracking-widest mb-3">Overall Assessment</p>
                  <p className="text-white/85 text-lg leading-relaxed border-l-4 border-primary pl-4">{aiInsights.overall}</p>
                </div>
                <div className="bg-zinc-900 text-white border-black-thick p-8 neobrutal-shadow flex flex-col items-center justify-center text-center">
                  <p className="text-xs font-extrabold uppercase text-zinc-400 tracking-widest mb-3">Effort Required</p>
                  <div className={`text-2xl font-extrabold uppercase px-6 py-3 border-2 border-white mb-3 ${WORK_STYLES[aiInsights.work_needed]?.bg || 'bg-yellow-500'}`}>{aiInsights.work_needed}</div>
                  <p className="text-xs text-zinc-400 font-bold uppercase">{aiInsights.work_hint}</p>
                </div>
              </div>

              {/* Strengths & Gaps */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white border-black-thick p-8 neobrutal-shadow">
                  <h3 className="font-extrabold uppercase mb-5 flex items-center gap-2 text-green-700">
                    <span className="material-icons">verified</span> Your Strengths
                  </h3>
                  <ul className="space-y-3">
                    {(aiInsights.strengths || []).map((s, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="material-icons text-green-600 text-sm mt-0.5 flex-shrink-0">check_circle</span>
                        <span className="text-sm font-medium">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white border-black-thick p-8 neobrutal-shadow">
                  <h3 className="font-extrabold uppercase mb-5 flex items-center gap-2 text-orange-600">
                    <span className="material-icons">construction</span> Gaps to Bridge
                  </h3>
                  <ul className="space-y-3">
                    {(aiInsights.gaps || []).map((g, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="material-icons text-orange-500 text-sm mt-0.5 flex-shrink-0">arrow_forward</span>
                        <span className="text-sm font-bold uppercase">{g.area} <span className="font-normal normal-case text-zinc-500">— {g.issue}</span></span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action plan */}
              <div className="bg-zinc-900 text-white border-black-thick p-8 neobrutal-shadow">
                <h3 className="font-extrabold uppercase mb-6 flex items-center gap-2">
                  <span className="material-icons text-primary">trending_up</span> Detailed Action Plan
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {(aiInsights.gaps || []).map((g, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 p-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-extrabold uppercase text-sm text-primary">{g.area}</span>
                        <span className="text-xs font-bold text-white/40 bg-white/10 px-2 py-0.5 rounded">{g.time}</span>
                      </div>
                      <p className="text-white/55 text-xs mb-3">{g.issue}</p>
                      <p className="text-white text-sm font-bold flex items-start gap-1">
                        <span className="material-icons text-primary text-sm mt-0.5 flex-shrink-0">bolt</span>{g.fix}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Roadmap + Verdict */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-primary/10 border-black-thick p-8 neobrutal-shadow">
                  <h3 className="font-extrabold uppercase mb-4 flex items-center gap-2">
                    <span className="material-icons text-primary">map</span> Roadmap
                  </h3>
                  <p className="text-sm leading-relaxed font-medium">{aiInsights.roadmap}</p>
                </div>
                <div className="bg-zinc-900 text-white border-black-thick p-8 neobrutal-shadow flex flex-col justify-center">
                  <span className="material-icons text-primary text-3xl mb-3">auto_awesome</span>
                  <p className="text-white font-bold italic text-lg leading-snug">"{aiInsights.verdict}"</p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* CTA */}
        <section className="mt-20 border-black-thick bg-yellow-50 p-10 neobrutal-shadow text-center">
          <h2 className="text-4xl font-extrabold uppercase mb-4">Want to boost your chances?</h2>
          <p className="text-lg font-medium max-w-2xl mx-auto mb-8">Re-run the predictor with improved scores, or explore your dashboard to compare past predictions.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/predict" className="bg-black text-white px-10 py-4 font-extrabold uppercase text-xl neobrutal-shadow-sm neobrutal-button inline-block text-center">New Prediction</Link>
            <Link to="/dashboard" className="bg-white text-black border-black-thick px-10 py-4 font-extrabold uppercase text-xl neobrutal-shadow-sm neobrutal-button inline-block text-center">View Dashboard</Link>
          </div>
        </section>
      </main>

      <footer className="bg-black text-white py-12 mt-20">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-primary border-2 border-white p-1"><span className="material-icons text-white">school</span></div>
              <span className="font-extrabold text-xl tracking-tighter uppercase">AdmitPredict</span>
            </div>
            <p className="text-zinc-400 font-medium">Empowering students through data-driven academic forecasting.</p>
          </div>
          <div className="flex gap-8 font-bold uppercase tracking-widest text-sm">
            <a className="hover:text-primary" href="#">Privacy</a>
            <a className="hover:text-primary" href="#">Terms</a>
            <a className="hover:text-primary" href="#">Contact</a>
          </div>
        </div>
        <div className="text-center mt-12 text-zinc-600 text-xs font-bold uppercase italic">
          © 2024 AdmitPredict. All academic results are estimates.
        </div>
      </footer>
    </div>
  )
}
