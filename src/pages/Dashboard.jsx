import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Dot,
} from 'recharts'
import { supabase as db, supabase } from '../lib/supabase'
import { getRiskStyle } from '../lib/predict'
import { fetchGeminiInsights } from '../lib/gemini'

function ProbDot({ cx, cy, payload }) {
  const fill = payload.prob >= 75 ? '#c2940a' : payload.prob >= 50 ? '#221e10' : '#ef4444'
  return <circle cx={cx} cy={cy} r={5} fill={fill} stroke="#fff" strokeWidth={2} />
}

function timeAgo(ts) {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const WORK_STYLES = {
  Low: 'bg-green-500', Medium: 'bg-yellow-500', High: 'bg-orange-500', Extensive: 'bg-red-500',
}

export default function Dashboard() {
  const [user, setUser]           = useState(null)
  const [history, setHistory]     = useState([])
  const [cloudStatus, setCloudStatus] = useState(null) // null | 'syncing' | 'synced' | 'offline'
  const [aiInsights, setAiInsights]   = useState(null)
  const [aiLoading, setAiLoading]     = useState(false)
  const [aiError, setAiError]         = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('admitPredict_user') || 'null')
    setUser(u)
    if (!u) return

    async function load() {
      let hist = JSON.parse(localStorage.getItem('admitPredict_history') || '[]')

      if (db) {
        setCloudStatus('syncing')
        try {
          const { data: rows, error } = await db
            .from('predictions')
            .select('*')
            .eq('user_email', u.email)
            .order('created_at', { ascending: false })

          if (error) throw new Error(error.message)

          if (rows && rows.length > 0) {
            hist = rows.map(r => ({
              gre: r.gre, toefl: r.toefl, cgpa: parseFloat(r.cgpa),
              sop: parseFloat(r.sop), lor: parseFloat(r.lor),
              research: r.research, rating: r.rating, probability: r.probability,
              timestamp: new Date(r.created_at).getTime(), fromCloud: true,
            }))
            localStorage.setItem('admitPredict_history', JSON.stringify(hist.slice(0, 20)))
          }
          setCloudStatus('synced')
          setTimeout(() => setCloudStatus(null), 2000)
        } catch (err) {
          console.warn('[AdmitPredict] Supabase fetch:', err.message)
          setCloudStatus('offline')
        }
      }

      setHistory(hist)

      // Trigger AI after a short delay to let the UI settle
      setTimeout(() => {
        const raw = localStorage.getItem('admitPredict_result')
        if (raw) triggerAI(JSON.parse(raw))
      }, 800)
    }

    load()
  }, [])

  async function triggerAI(d) {
    if (!d) return
    setAiLoading(true)
    setAiError('')
    setAiInsights(null)
    try {
      const insights = await fetchGeminiInsights(d)
      setAiInsights(insights)
    } catch (err) {
      setAiError(err.message || 'Could not reach Gemini.')
    } finally {
      setAiLoading(false)
    }
  }

  function clearHistory() {
    if (confirm('Clear all saved predictions?')) {
      localStorage.removeItem('admitPredict_history')
      localStorage.removeItem('admitPredict_result')
      setHistory([])
    }
  }

  async function logout() {
    if (confirm('Sign out of AdmitPredict?')) {
      if (supabase) await supabase.auth.signOut()
      localStorage.removeItem('admitPredict_user')
      localStorage.removeItem('admitPredict_history')
      localStorage.removeItem('admitPredict_result')
      navigate('/')
    }
  }

  const latestRaw = localStorage.getItem('admitPredict_result')
  const hasLatest = !!latestRaw

  const latest = history[0] || null
  const bestScore = history.length > 0 ? Math.max(...history.map(h => h.probability)) : null
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const recentCount = history.filter(h => h.timestamp > weekAgo).length

  return (
    <div className="bg-background-light text-slate-900 font-display min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 border-r-4 border-primary bg-white hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b-2 border-primary/20">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary flex items-center justify-center text-white font-bold rounded">A</div>
            <h1 className="text-xl font-bold tracking-tight">ADMITPREDICT</h1>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link className="flex items-center gap-3 p-3 bg-primary text-white brutalist-shadow rounded transition-all" to="/dashboard">
            <span className="material-icons">dashboard</span><span className="font-medium">Dashboard</span>
          </Link>
          <Link className="flex items-center gap-3 p-3 text-slate-600 hover:bg-primary/10 rounded transition-all" to="/predict">
            <span className="material-icons">analytics</span><span className="font-medium">New Prediction</span>
          </Link>
          <Link className="flex items-center gap-3 p-3 text-slate-600 hover:bg-primary/10 rounded transition-all" to="/results">
            <span className="material-icons">history</span><span className="font-medium">Latest Result</span>
          </Link>
          <Link className="flex items-center gap-3 p-3 text-slate-600 hover:bg-primary/10 rounded transition-all" to="/">
            <span className="material-icons">school</span><span className="font-medium">Home</span>
          </Link>
        </nav>
        <div className="p-4 border-t-2 border-primary/20">
          {user ? (
            <div id="user-panel" className="p-4 bg-primary/10 rounded border border-primary/30">
              <p className="text-xs font-bold uppercase text-primary mb-1">Signed In As</p>
              <p className="text-sm font-bold truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          ) : (
            <div className="p-4 bg-primary/10 rounded border border-primary/30">
              <p className="text-xs font-bold uppercase text-primary mb-1">Account Status</p>
              <p className="text-sm font-semibold">Guest User</p>
              <Link to="/login" className="mt-2 block text-xs font-bold text-primary underline underline-offset-2">Sign in to save →</Link>
            </div>
          )}
          {user && (
            <button onClick={logout} className="mt-4 flex items-center gap-3 p-3 w-full text-slate-600 hover:bg-red-50 rounded transition-all text-left">
              <span className="material-icons">logout</span><span className="font-medium">Logout</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="bg-white border-b-2 border-primary/20 sticky top-0 z-10 px-8 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{user ? `Welcome back, ${user.name.split(' ')[0]}!` : 'Your Dashboard'}</h2>
            <p className="text-slate-500 text-sm">Review your admission probabilities.</p>
          </div>
          <div className="flex items-center gap-3">
            {cloudStatus && (
              <span className="flex items-center gap-1 text-xs font-bold text-slate-500">
                <span className={`material-icons text-sm ${cloudStatus === 'synced' ? 'text-green-600' : cloudStatus === 'offline' ? 'text-red-500' : ''}`}>
                  {cloudStatus === 'syncing' ? 'cloud_sync' : cloudStatus === 'synced' ? 'cloud_done' : 'cloud_off'}
                </span>
                <span>{cloudStatus === 'syncing' ? 'Syncing…' : cloudStatus === 'synced' ? 'Synced' : 'Offline'}</span>
              </span>
            )}
            {!user && <Link to="/login" className="text-sm font-bold border-b-2 border-primary text-primary hover:text-primary/80 transition-colors">Sign In</Link>}
            <Link to="/predict" className="bg-primary text-white border-2 border-slate-900 px-4 py-2 font-bold uppercase text-sm brutalist-shadow hover:opacity-90 transition-all">
              + New Prediction
            </Link>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-8">
          {/* Login gate */}
          {!user && (
            <div className="border-4 border-primary bg-white p-12 text-center brutalist-shadow-primary max-w-xl mx-auto mt-8">
              <span className="material-icons text-primary text-6xl mb-4 block">lock</span>
              <h2 className="text-3xl font-extrabold uppercase mb-3">Sign In to View Your Dashboard</h2>
              <p className="text-slate-500 font-medium mb-8">Your prediction history and stats are tied to your account. Log in to access them.</p>
              <Link to="/login" className="inline-block bg-primary text-white font-extrabold uppercase px-10 py-4 border-4 border-slate-900 brutalist-shadow hover:opacity-90 transition-all">Sign In</Link>
              <p className="mt-6 text-sm text-slate-400"><Link to="/predict" className="underline hover:text-primary">Predict as guest</Link> — results won't be saved to your account.</p>
            </div>
          )}

          {user && (
            <>
              {/* Stats row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white border-2 border-slate-900 p-6 brutalist-shadow">
                  <p className="text-xs font-bold uppercase text-slate-500 mb-1">Total Predictions</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{history.length}</span>
                    {recentCount > 0 && <span className="text-sm text-green-600 font-bold">+{recentCount} this week</span>}
                  </div>
                </div>
                <div className="bg-white border-2 border-slate-900 p-6 brutalist-shadow">
                  <p className="text-xs font-bold uppercase text-slate-500 mb-1">Latest Probability</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{latest ? `${latest.probability}%` : '--'}</span>
                    {latest && <span className="text-sm text-primary font-bold">{getRiskStyle(latest.probability).label}</span>}
                  </div>
                </div>
                <div className="bg-white border-2 border-slate-900 p-6 brutalist-shadow">
                  <p className="text-xs font-bold uppercase text-slate-500 mb-1">Best Score</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{bestScore !== null ? `${bestScore}%` : '--'}</span>
                    {bestScore !== null && (
                      <span className="text-xs font-bold bg-primary text-white px-2 py-0.5 rounded">
                        {bestScore >= 75 ? 'SAFE' : bestScore >= 50 ? 'TARGET' : 'REACH'}
                      </span>
                    )}
                  </div>
                </div>
                <Link to="/predict" className="bg-white border-4 border-primary p-6 brutalist-shadow-primary flex flex-col items-center justify-center text-center cursor-pointer hover:translate-y-1 hover:shadow-none transition-all">
                  <span className="material-icons text-primary text-3xl mb-1">add_circle</span>
                  <p className="font-bold text-slate-900">Run New Simulation</p>
                </Link>
              </div>

              {/* AI Counselor */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary border-2 border-slate-900 flex items-center justify-center">
                      <span className="material-icons text-white">auto_awesome</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold leading-none">AI Counselor</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Powered by Groq · Based on your latest prediction</p>
                    </div>
                  </div>
                  {hasLatest && (
                    <button onClick={() => triggerAI(JSON.parse(latestRaw))} className="flex items-center gap-1 border-2 border-slate-900 px-3 py-2 text-xs font-extrabold uppercase brutalist-shadow bg-white hover:bg-primary hover:text-white transition-colors">
                      <span className="material-icons text-sm">refresh</span> Refresh
                    </button>
                  )}
                </div>

                {!hasLatest && !aiLoading && (
                  <div className="border-4 border-dashed border-slate-300 p-10 text-center">
                    <span className="material-icons text-slate-300 text-5xl mb-3 block">psychology</span>
                    <p className="font-bold text-slate-500 mb-4">No prediction data yet — run your first prediction to unlock AI insights.</p>
                    <Link to="/predict" className="inline-block bg-primary text-white font-extrabold uppercase px-8 py-3 border-2 border-slate-900 brutalist-shadow">Run Prediction</Link>
                  </div>
                )}

                {aiLoading && (
                  <div className="bg-slate-900 border-2 border-slate-900 p-10 text-center brutalist-shadow">
                    <span className="material-icons text-primary text-5xl block mb-3 spin-slow">autorenew</span>
                    <p className="font-extrabold uppercase text-slate-400 text-sm tracking-widest">Analysing your profile…</p>
                  </div>
                )}

                {aiError && !aiLoading && (
                  <div className="bg-red-50 border-2 border-red-300 p-6 text-center">
                    <span className="material-icons text-red-400 text-3xl mb-2 block">cloud_off</span>
                    <p className="font-bold text-red-600 text-sm">{aiError}</p>
                  </div>
                )}

                {aiInsights && !aiLoading && (
                  <div className="space-y-5">
                    {/* Overall + effort */}
                    <div className="grid md:grid-cols-3 gap-5">
                      <div className="md:col-span-2 bg-slate-900 text-white border-2 border-slate-900 p-7 brutalist-shadow">
                        <p className="text-xs font-extrabold uppercase text-primary tracking-widest mb-3">Overall Assessment</p>
                        <p className="text-white/85 leading-relaxed border-l-4 border-primary pl-4">{aiInsights.overall}</p>
                      </div>
                      <div className="bg-slate-900 text-white border-2 border-slate-900 p-7 brutalist-shadow flex flex-col items-center justify-center text-center gap-3">
                        <p className="text-xs font-extrabold uppercase text-slate-400 tracking-widest">Work Needed</p>
                        <div className={`text-xl font-extrabold uppercase px-5 py-2 border-2 border-white ${WORK_STYLES[aiInsights.work_needed] || 'bg-yellow-500'}`}>{aiInsights.work_needed}</div>
                        <p className="text-xs text-slate-400 font-bold">{aiInsights.work_hint}</p>
                      </div>
                    </div>

                    {/* Strengths + Gaps */}
                    <div className="grid md:grid-cols-2 gap-5">
                      <div className="bg-white border-2 border-slate-900 p-7 brutalist-shadow">
                        <h4 className="font-extrabold uppercase text-green-700 mb-4 flex items-center gap-2 text-sm">
                          <span className="material-icons text-base">verified</span> Strengths
                        </h4>
                        <ul className="space-y-2">
                          {(aiInsights.strengths || []).map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <span className="material-icons text-green-600 text-sm mt-0.5 flex-shrink-0">check_circle</span>
                              <span className="font-medium text-slate-700">{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-white border-2 border-slate-900 p-7 brutalist-shadow">
                        <h4 className="font-extrabold uppercase text-orange-600 mb-4 flex items-center gap-2 text-sm">
                          <span className="material-icons text-base">construction</span> Gaps to Address
                        </h4>
                        <ul className="space-y-2">
                          {(aiInsights.gaps || []).map((g, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <span className="material-icons text-orange-500 text-sm mt-0.5 flex-shrink-0">arrow_forward</span>
                              <span><span className="font-extrabold uppercase text-slate-800">{g.area}</span> <span className="text-slate-500">— {g.issue}</span></span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Action plan */}
                    <div className="bg-slate-900 text-white border-2 border-slate-900 p-7 brutalist-shadow">
                      <h4 className="font-extrabold uppercase text-sm mb-5 flex items-center gap-2">
                        <span className="material-icons text-primary">bolt</span> Action Plan
                      </h4>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(aiInsights.gaps || []).map((g, i) => (
                          <div key={i} className="bg-white/5 border border-white/15 p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-extrabold uppercase text-xs text-primary">{g.area}</span>
                              <span className="text-[10px] font-bold text-white/40 bg-white/10 px-2 py-0.5 rounded">{g.time}</span>
                            </div>
                            <p className="text-white/55 text-xs mb-2">{g.issue}</p>
                            <p className="text-white text-sm font-bold flex items-start gap-1">
                              <span className="material-icons text-primary text-sm mt-0.5 flex-shrink-0">bolt</span>{g.fix}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Roadmap + Verdict */}
                    <div className="grid md:grid-cols-2 gap-5">
                      <div className="bg-primary/10 border-2 border-slate-900 p-7 brutalist-shadow">
                        <h4 className="font-extrabold uppercase text-sm mb-3 flex items-center gap-2">
                          <span className="material-icons text-primary">map</span> Roadmap
                        </h4>
                        <p className="text-sm leading-relaxed font-medium text-slate-700">{aiInsights.roadmap}</p>
                      </div>
                      <div className="bg-slate-900 text-white border-2 border-slate-900 p-7 brutalist-shadow flex flex-col justify-center">
                        <span className="material-icons text-primary text-3xl mb-3">format_quote</span>
                        <p className="font-bold italic text-lg leading-snug text-white">"{aiInsights.verdict}"</p>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Probability chart */}
              <section className="bg-white border-2 border-slate-900 p-8 brutalist-shadow">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold">Probability Over Time</h3>
                    <p className="text-sm text-slate-500">Your last {Math.min(history.length, 10)} predictions</p>
                  </div>
                  <Link to="/results" className="text-xs font-extrabold uppercase border-b-2 border-primary text-primary hover:opacity-70 transition-opacity">View Full Report →</Link>
                </div>
                {history.length === 0 ? (
                  <div className="h-48 flex items-center justify-center border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 font-bold text-sm">
                      No predictions yet.{' '}
                      <Link to="/predict" className="text-primary underline">Run your first prediction.</Link>
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart
                      data={[...history].reverse().slice(0, 10).map((h, i) => ({
                        run: `#${i + 1}`,
                        prob: h.probability,
                        gre: h.gre,
                        cgpa: h.cgpa,
                        toefl: h.toefl,
                      }))}
                      margin={{ top: 10, right: 20, bottom: 0, left: -10 }}
                    >
                      <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
                      <XAxis
                        dataKey="run"
                        tick={{ fontFamily: 'Lexend', fontWeight: 700, fontSize: 11, fill: '#64748b' }}
                        axisLine={{ stroke: '#221e10' }} tickLine={false}
                      />
                      <YAxis
                        domain={[0, 100]} tickCount={5}
                        tickFormatter={v => `${v}%`}
                        tick={{ fontFamily: 'Lexend', fontWeight: 700, fontSize: 11, fill: '#64748b' }}
                        axisLine={false} tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{ border: '2px solid #221e10', borderRadius: 0, fontFamily: 'Lexend', fontWeight: 700, fontSize: 12 }}
                        formatter={(val, _, props) => [
                          `${val}%  ·  GRE ${props.payload.gre}  ·  CGPA ${props.payload.cgpa}  ·  TOEFL ${props.payload.toefl}`,
                          'Probability',
                        ]}
                      />
                      <ReferenceLine y={75} stroke="#c2940a" strokeDasharray="6 3" strokeWidth={1.5} label={{ value: 'Strong', position: 'insideTopRight', fontFamily: 'Lexend', fontSize: 10, fontWeight: 700, fill: '#c2940a' }} />
                      <ReferenceLine y={50} stroke="#94a3b8" strokeDasharray="6 3" strokeWidth={1.5} label={{ value: 'Moderate', position: 'insideTopRight', fontFamily: 'Lexend', fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                      <Line
                        type="monotone" dataKey="prob"
                        stroke="#221e10" strokeWidth={2.5}
                        dot={<ProbDot />}
                        activeDot={{ r: 7, fill: '#c2940a', stroke: '#221e10', strokeWidth: 2 }}
                        animationDuration={800}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </section>

              {/* History list */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold">Saved Predictions</h3>
                    <p className="text-sm text-slate-500">
                      {history.length > 0 ? `${history.length} prediction${history.length !== 1 ? 's' : ''} saved` : 'No predictions yet'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Link to="/predict" className="bg-primary text-white border-2 border-slate-900 px-4 py-2 font-bold uppercase text-sm brutalist-shadow hover:opacity-90 transition-all">
                      + New
                    </Link>
                    {history.length > 0 && (
                      <button onClick={clearHistory} className="text-sm font-bold border-b-2 border-red-400 text-red-500 hover:text-red-700 transition-colors">
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                {history.length === 0 ? (
                  <div className="border-4 border-dashed border-slate-300 p-10 flex flex-col items-center justify-center min-h-[200px]">
                    <span className="material-icons text-slate-300 text-4xl mb-4">inbox</span>
                    <p className="font-bold text-slate-400 text-center">
                      No predictions yet.<br />
                      <Link to="/predict" className="text-primary underline">Run your first prediction</Link> to see results here.
                    </p>
                  </div>
                ) : (
                  <div className="border-2 border-slate-900 brutalist-shadow overflow-hidden">
                    {/* Column header */}
                    <div className="grid grid-cols-[3rem_1fr_5rem_5rem_5rem_5rem_4rem_5rem_6rem] bg-slate-900 text-white px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest sticky top-0 z-10 hidden md:grid">
                      <div>#</div>
                      <div>Status</div>
                      <div>Prob.</div>
                      <div>GRE</div>
                      <div>CGPA</div>
                      <div>TOEFL</div>
                      <div>Res.</div>
                      <div>Tier</div>
                      <div>When</div>
                    </div>

                    {/* Scrollable rows */}
                    <div className="max-h-[480px] overflow-y-auto divide-y divide-slate-100">
                      {history.map((item, i) => {
                        const risk = getRiskStyle(item.probability)
                        const barColor = item.probability >= 75 ? 'bg-green-500' : item.probability >= 50 ? 'bg-yellow-400' : 'bg-red-500'
                        const probColor = item.probability >= 75 ? 'text-green-700' : item.probability >= 50 ? 'text-yellow-600' : 'text-red-600'
                        return (
                          <div
                            key={i}
                            className="group bg-white hover:bg-slate-50 transition-colors"
                          >
                            {/* Desktop row */}
                            <div className="hidden md:grid grid-cols-[3rem_1fr_5rem_5rem_5rem_5rem_4rem_5rem_6rem] items-center px-4 py-4 gap-1">
                              <span className="text-xs font-bold text-slate-400">#{history.length - i}</span>

                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase shrink-0 ${risk.badge}`}>{risk.label}</span>
                                {item.fromCloud && (
                                  <span className="material-icons text-xs text-primary shrink-0" title="Synced from cloud">cloud_done</span>
                                )}
                              </div>

                              <div className="flex flex-col gap-1">
                                <span className={`text-sm font-extrabold ${probColor}`}>{item.probability}%</span>
                                <div className="w-full h-1.5 bg-slate-100 overflow-hidden rounded-sm">
                                  <div className={`h-full ${barColor} rounded-sm`} style={{ width: `${item.probability}%` }} />
                                </div>
                              </div>

                              <span className="text-sm font-bold">{item.gre}</span>
                              <span className="text-sm font-bold">{item.cgpa}</span>
                              <span className="text-sm font-bold">{item.toefl}</span>
                              <span className="text-sm font-bold">{item.research ? 'Yes' : 'No'}</span>
                              <span className="text-sm font-bold">{item.rating}/5</span>

                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-400 font-medium">{timeAgo(item.timestamp)}</span>
                                <Link to="/results" className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 text-primary" title="Full report">
                                  <span className="material-icons text-base">open_in_new</span>
                                </Link>
                              </div>
                            </div>

                            {/* Mobile card (shown on small screens) */}
                            <div className="md:hidden p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-400">#{history.length - i}</span>
                                  <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase ${risk.badge}`}>{risk.label}</span>
                                  {item.fromCloud && <span className="material-icons text-xs text-primary">cloud_done</span>}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-lg font-extrabold ${probColor}`}>{item.probability}%</span>
                                  <Link to="/results" className="text-primary"><span className="material-icons text-base">open_in_new</span></Link>
                                </div>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 overflow-hidden rounded-sm mb-3">
                                <div className={`h-full ${barColor} rounded-sm`} style={{ width: `${item.probability}%` }} />
                              </div>
                              <div className="grid grid-cols-4 gap-2 text-center">
                                {[
                                  { label: 'GRE',  value: item.gre },
                                  { label: 'CGPA', value: item.cgpa },
                                  { label: 'TOEFL',value: item.toefl },
                                  { label: 'Tier', value: `${item.rating}/5` },
                                ].map(m => (
                                  <div key={m.label} className="bg-slate-50 border border-slate-200 p-2 rounded">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">{m.label}</p>
                                    <p className="text-sm font-bold">{m.value}</p>
                                  </div>
                                ))}
                              </div>
                              <p className="text-xs text-slate-400 mt-2 text-right">{timeAgo(item.timestamp)}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Footer count */}
                    <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase">{history.length} prediction{history.length !== 1 ? 's' : ''}</span>
                      <Link to="/predict" className="text-xs font-bold text-primary flex items-center gap-1 hover:opacity-70 transition-opacity">
                        <span className="material-icons text-sm">add</span> New prediction
                      </Link>
                    </div>
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        <footer className="p-8 border-t-2 border-primary/20 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500 gap-4">
          <p>© 2024 AdmitPredict - Academic Data Insights Platform</p>
          <div className="flex gap-6">
            <a className="hover:text-primary font-medium" href="#">Privacy Policy</a>
            <a className="hover:text-primary font-medium" href="#">Terms of Service</a>
          </div>
        </footer>
      </main>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-primary px-6 py-2 flex justify-between items-center z-50">
        <Link to="/dashboard" className="p-2 text-primary"><span className="material-icons">dashboard</span></Link>
        <Link to="/results"   className="p-2 text-slate-400"><span className="material-icons">history</span></Link>
        <Link to="/predict"   className="w-12 h-12 bg-primary text-white rounded-full brutalist-shadow -mt-8 flex items-center justify-center"><span className="material-icons">add</span></Link>
        <Link to="/"          className="p-2 text-slate-400"><span className="material-icons">school</span></Link>
        <Link to="/login"     className="p-2 text-slate-400"><span className="material-icons">person</span></Link>
      </div>
    </div>
  )
}
