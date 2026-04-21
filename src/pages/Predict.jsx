import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { db } from '../lib/supabase'
import { calcProb } from '../lib/predict'

export default function Predict() {
  const [gre, setGre] = useState('')
  const [toefl, setToefl] = useState('')
  const [cgpa, setCgpa] = useState('')
  const [sop, setSop] = useState(3)
  const [lor, setLor] = useState(3)
  const [research, setResearch] = useState(false)
  const [rating, setRating] = useState(3)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const quick = localStorage.getItem('admitPredict_quickData')
    if (quick) {
      const d = JSON.parse(quick)
      if (d.cgpa) setCgpa(String(d.cgpa))
      if (d.gre)  setGre(String(d.gre))
      localStorage.removeItem('admitPredict_quickData')
    }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    const newErrors = {}
    const greVal  = parseInt(gre)
    const toeflVal = parseInt(toefl)
    const cgpaVal = parseFloat(cgpa)

    if (!gre  || isNaN(greVal))   newErrors.gre   = true
    if (!toefl || isNaN(toeflVal)) newErrors.toefl = true
    if (!cgpa  || isNaN(cgpaVal))  newErrors.cgpa  = true

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setLoading(true)
    const probability = await calcProb({ gre: greVal, toefl: toeflVal, cgpa: cgpaVal, sop, lor, research, rating })
    const data = { gre: greVal, toefl: toeflVal, cgpa: cgpaVal, sop, lor, research, rating, probability, timestamp: Date.now() }

    localStorage.setItem('admitPredict_result', JSON.stringify(data))
    const history = JSON.parse(localStorage.getItem('admitPredict_history') || '[]')
    history.unshift(data)
    localStorage.setItem('admitPredict_history', JSON.stringify(history.slice(0, 20)))

    if (db) {
      const user = JSON.parse(localStorage.getItem('admitPredict_user') || 'null')
      try {
        const { error } = await db.from('predictions').insert({
          user_email: user?.email ?? null,
          user_name:  user?.name  ?? null,
          gre: greVal, toefl: toeflVal, cgpa: cgpaVal, sop, lor, research, rating, probability,
        })
        if (error) console.warn('[AdmitPredict] Supabase insert:', error.message)
      } catch (err) {
        console.warn('[AdmitPredict] Supabase insert failed:', err.message)
      }
    }

    setLoading(false)
    navigate('/results')
  }

  return (
    <div className="bg-background-light font-display text-[#221e10] min-h-screen py-12 px-4">
      {/* Top nav */}
      <div className="max-w-3xl mx-auto mb-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 font-black uppercase text-sm tracking-widest hover:text-primary transition-colors">
          <span className="material-icons text-sm">arrow_back</span> Home
        </Link>
        <Link to="/dashboard" className="font-bold uppercase text-sm tracking-widest hover:text-primary transition-colors">Dashboard</Link>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="mb-10 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold uppercase tracking-tighter mb-4 bg-primary inline-block px-4 py-2 neo-border neo-shadow text-white">
            Predictor
          </h1>
          <p className="text-xl font-bold mt-6 text-[#221e10]/80">
            ENTER YOUR STATS TO ESTIMATE YOUR GRADUATE ADMISSION CHANCES
          </p>
        </header>

        {/* Form Card */}
        <main className="bg-card-bg neo-border neo-shadow p-8 md:p-12 mb-12">
          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* GRE & TOEFL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-lg font-extrabold uppercase tracking-tight" htmlFor="gre">GRE Score (Max 340)</label>
                <input
                  id="gre" type="number" min="260" max="340" placeholder="e.g. 320"
                  className="w-full neo-border bg-input-bg p-4 text-xl font-bold neo-input transition-all"
                  value={gre} onChange={e => setGre(e.target.value)}
                />
                {errors.gre && (
                  <div className="bg-accent-red text-white p-2 neo-border flex items-center gap-2 mt-2">
                    <span className="material-icons text-sm">error</span>
                    <span className="font-bold text-xs uppercase">Enter a value between 260 and 340</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="block text-lg font-extrabold uppercase tracking-tight" htmlFor="toefl">TOEFL Score (Max 120)</label>
                <input
                  id="toefl" type="number" min="0" max="120" placeholder="e.g. 110"
                  className="w-full neo-border bg-input-bg p-4 text-xl font-bold neo-input transition-all"
                  value={toefl} onChange={e => setToefl(e.target.value)}
                />
                {errors.toefl && (
                  <div className="bg-accent-red text-white p-2 neo-border flex items-center gap-2 mt-2">
                    <span className="material-icons text-sm">error</span>
                    <span className="font-bold text-xs uppercase">Enter a value between 0 and 120</span>
                  </div>
                )}
              </div>
            </div>

            {/* University Rating & CGPA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-lg font-extrabold uppercase tracking-tight">University Rating (1=Easiest, 5=Hardest)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(val => (
                    <label key={val} className="flex-1 cursor-pointer">
                      <input
                        type="radio" name="rating" value={val}
                        checked={rating === val}
                        onChange={() => setRating(val)}
                        className="hidden peer"
                      />
                      <div className={`neo-border p-3 text-center font-black transition-all ${rating === val ? 'bg-primary text-white' : 'bg-input-bg'}`}>
                        {val}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-lg font-extrabold uppercase tracking-tight" htmlFor="cgpa">CGPA (Scale of 10)</label>
                <input
                  id="cgpa" type="number" min="0" max="10" step="0.01" placeholder="e.g. 8.5"
                  className="w-full neo-border bg-input-bg p-4 text-xl font-bold neo-input transition-all"
                  value={cgpa} onChange={e => setCgpa(e.target.value)}
                />
                {errors.cgpa && (
                  <div className="bg-accent-red text-white p-2 neo-border flex items-center gap-2 mt-2">
                    <span className="material-icons text-sm">error</span>
                    <span className="font-bold text-xs uppercase">Enter a value between 0 and 10</span>
                  </div>
                )}
              </div>
            </div>

            {/* SOP & LOR */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-lg font-extrabold uppercase tracking-tight" htmlFor="sop">
                  SOP Strength: <span className="range-value text-primary">{sop.toFixed(1)}</span>
                </label>
                <input
                  id="sop" type="range" min="1" max="5" step="0.5"
                  className="w-full h-8 bg-input-bg neo-border appearance-none cursor-pointer accent-primary"
                  value={sop} onChange={e => setSop(parseFloat(e.target.value))}
                />
                <div className="flex justify-between font-bold text-sm px-1">
                  <span>1.0</span><span>2.0</span><span>3.0</span><span>4.0</span><span>5.0</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-lg font-extrabold uppercase tracking-tight" htmlFor="lor">
                  LOR Strength: <span className="range-value text-primary">{lor.toFixed(1)}</span>
                </label>
                <input
                  id="lor" type="range" min="1" max="5" step="0.5"
                  className="w-full h-8 bg-input-bg neo-border appearance-none cursor-pointer accent-primary"
                  value={lor} onChange={e => setLor(parseFloat(e.target.value))}
                />
                <div className="flex justify-between font-bold text-sm px-1">
                  <span>1.0</span><span>2.0</span><span>3.0</span><span>4.0</span><span>5.0</span>
                </div>
              </div>
            </div>

            {/* Research Toggle */}
            <div className="p-6 bg-primary/10 neo-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-extrabold uppercase">Research Experience</h3>
                  <p className="text-sm font-bold opacity-70 uppercase">Have you published any papers?</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={research}
                    onChange={e => setResearch(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-20 h-10 neo-border transition-colors duration-200 flex items-center px-1 ${research ? 'bg-primary' : 'bg-[#ddd]'}`}>
                    <div className={`w-7 h-7 bg-white neo-border transition-transform duration-200 ${research ? 'translate-x-10' : 'translate-x-0'}`} />
                  </div>
                </label>
              </div>
            </div>

            {/* General error */}
            {Object.keys(errors).length > 0 && (
              <div className="bg-accent-red text-white p-4 neo-border flex items-center gap-2">
                <span className="material-icons">error</span>
                <span className="font-bold uppercase">Please fill in GRE, TOEFL, and CGPA before predicting.</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary py-6 neo-border neo-shadow hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all duration-75 disabled:opacity-60"
            >
              <span className="text-3xl font-black uppercase tracking-widest text-white flex items-center justify-center gap-3">
                {loading ? (
                  <>Saving… <span className="material-icons text-4xl spin-slow">autorenew</span></>
                ) : (
                  <>Predict Now <span className="material-icons text-4xl">trending_up</span></>
                )}
              </span>
            </button>
          </form>
        </main>

        {/* Footer cards */}
        <footer className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#221e10] text-white p-6 neo-border neo-shadow">
            <h4 className="font-extrabold uppercase mb-2">How it works</h4>
            <p className="text-xs leading-relaxed opacity-80">Our engine uses historical admission data to calculate your probability of acceptance based on the parameters provided.</p>
          </div>
          <div className="bg-white p-6 neo-border neo-shadow">
            <h4 className="font-extrabold uppercase mb-2">Confidential</h4>
            <p className="text-xs leading-relaxed opacity-80">Your data is processed locally. We do not store your personal academic metrics on our servers.</p>
          </div>
          <div className="bg-primary p-6 neo-border neo-shadow">
            <h4 className="font-extrabold uppercase mb-2 text-white">Disclaimer</h4>
            <p className="text-xs leading-relaxed text-white/90">Predictions are estimates. Final decisions rest solely with university admissions committees.</p>
          </div>
        </footer>
      </div>

      {/* Decorative */}
      <div className="fixed top-10 right-10 -z-10 opacity-20 hidden lg:block">
        <div className="w-48 h-48 border-4 border-[#221e10] rotate-12 bg-primary" />
      </div>
      <div className="fixed bottom-10 left-10 -z-10 opacity-20 hidden lg:block">
        <div className="w-32 h-32 border-4 border-[#221e10] -rotate-45 bg-[#ff4d4d]" />
      </div>
    </div>
  )
}
