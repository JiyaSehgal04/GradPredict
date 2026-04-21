import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Home() {
  const [quickGpa, setQuickGpa] = useState('')
  const [quickGre, setQuickGre] = useState('')
  const navigate = useNavigate()

  function quickCalc() {
    const data = {}
    if (quickGpa) data.cgpa = parseFloat(quickGpa)
    if (quickGre) data.gre = parseInt(quickGre)
    if (quickGpa || quickGre) {
      localStorage.setItem('admitPredict_quickData', JSON.stringify(data))
    }
    navigate('/predict')
  }

  return (
    <div className="text-brutalist-black selection:bg-primary selection:text-white">
      {/* Background shapes — fixed behind all content at root stacking context */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -1 }}>
        <div className="absolute w-64 h-64 rounded-full bg-primary opacity-[0.15] top-20 -left-20 rotate-12" />
        <div className="absolute w-96 h-96 rounded-lg bg-primary opacity-[0.15] bottom-10 right-10 -rotate-45" />
        <div className="absolute w-48 h-48 rounded-full bg-primary opacity-[0.15] blur-xl top-1/2 left-1/3" />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background-light/90 border-b-[4px] border-primary px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary border-2 border-brutalist-black flex items-center justify-center font-black text-xl text-white">A</div>
            <span className="text-2xl font-black tracking-tighter uppercase">AdmitPredict</span>
          </div>
          <div className="hidden md:flex items-center gap-8 font-bold uppercase text-sm tracking-widest">
            <Link className="hover:text-primary transition-colors" to="/">Home</Link>
            <Link className="hover:text-primary transition-colors" to="/predict">Predict</Link>
            <Link className="hover:text-primary transition-colors" to="/dashboard">Dashboard</Link>
            <Link className="bg-primary text-white px-6 py-2 border-2 border-brutalist-black neobrutal-shadow-black active:translate-x-1 active:translate-y-1 active:shadow-none transition-all" to="/login">Login</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative pt-24 pb-16 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-6xl md:text-8xl font-black uppercase leading-none mb-8">
            Predict Your <br /><span className="text-primary italic">Academic</span> Future
          </h1>
          <p className="text-xl md:text-2xl font-medium max-w-2xl mx-auto mb-12 opacity-80">
            Data-driven graduate admission forecasting. Estimate your acceptance probability into top-tier universities using 10+ academic metrics.
          </p>
          <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
            <Link to="/predict" className="text-2xl font-black uppercase px-12 py-6 bg-primary text-white border-[4px] border-brutalist-black neobrutal-shadow-black hover:bg-opacity-90 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all">
              Get Prediction
            </Link>
            <button
              onClick={() => document.getElementById('methodology').scrollIntoView({ behavior: 'smooth' })}
              className="text-xl font-bold uppercase px-8 py-6 bg-background-light border-[4px] border-brutalist-black neobrutal-shadow-black hover:bg-primary/10 transition-all"
            >
              View Methodology
            </button>
          </div>
        </div>
      </header>

      {/* Quick Tool */}
      <section className="px-6 py-16">
        <div className="max-w-6xl mx-auto bg-background-light border-[4px] border-primary p-8 md:p-12 neobrutal-shadow-black">
          <div className="grid md:grid-cols-3 gap-8 items-end">
            <div className="space-y-4">
              <label className="block text-sm font-black uppercase tracking-widest">Undergrad GPA (0–10)</label>
              <input
                id="quick-gpa"
                className="w-full bg-primary/10 border-2 border-brutalist-black p-4 font-bold focus:outline-none focus:ring-0 focus:border-primary"
                placeholder="e.g. 8.5"
                type="number"
                min="0" max="10" step="0.01"
                value={quickGpa}
                onChange={e => setQuickGpa(e.target.value)}
              />
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-black uppercase tracking-widest">GRE Score (260–340)</label>
              <input
                id="quick-gre"
                className="w-full bg-primary/10 border-2 border-brutalist-black p-4 font-bold focus:outline-none focus:ring-0 focus:border-primary"
                placeholder="e.g. 325"
                type="number"
                min="260" max="340"
                value={quickGre}
                onChange={e => setQuickGre(e.target.value)}
              />
            </div>
            <div>
              <button
                onClick={quickCalc}
                className="w-full bg-primary text-white border-2 border-brutalist-black p-4 font-black uppercase tracking-widest hover:bg-opacity-90 transition-all"
              >
                Fast Calc
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Metric Cards */}
      <section className="px-6 py-20 bg-primary/5">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-black uppercase mb-16 text-center underline decoration-primary decoration-8 underline-offset-8">Core Metrics Tracked</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: 'school', title: 'GPA Score', desc: 'Weightage calculated based on institutional prestige and major difficulty.' },
              { icon: 'description', title: 'GRE/GMAT', desc: 'Standardized test benchmarking against previous year acceptance data.' },
              { icon: 'science', title: 'Research', desc: 'Quantifying your publications, lab experience, and patent filings.' },
              { icon: 'forum', title: 'LOR Strength', desc: 'Sentiment analysis on letters of recommendation impact scores.' },
            ].map(card => (
              <div key={card.title} className="bg-white p-8 border-[3px] border-brutalist-black neobrutal-shadow hover:-translate-y-2 transition-transform">
                <div className="w-12 h-12 bg-primary/20 border-2 border-brutalist-black mb-6 flex items-center justify-center">
                  <span className="material-icons text-primary">{card.icon}</span>
                </div>
                <h3 className="text-xl font-black uppercase mb-4">{card.title}</h3>
                <p className="font-medium opacity-70">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-24 border-y-[4px] border-primary">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div><div className="text-7xl font-black text-primary mb-2">500+</div><div className="text-xl font-bold uppercase tracking-widest">Universities</div></div>
            <div><div className="text-7xl font-black text-primary mb-2">120K</div><div className="text-xl font-bold uppercase tracking-widest">Data Points</div></div>
            <div><div className="text-7xl font-black text-primary mb-2">94%</div><div className="text-xl font-bold uppercase tracking-widest">Accuracy</div></div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="methodology" className="px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-5xl font-black uppercase text-center mb-20 italic">Simple Three-Step Process</h2>
          <div className="space-y-12">
            {[
              { num: '01', title: 'Input Academic Profile', desc: 'Upload your transcripts or manually enter scores. Our system handles both domestic and international grading scales.', reverse: false },
              { num: '02', title: 'Algorithm Processing', desc: 'Our neural networks compare your profile against successful applicants from the last 5 admission cycles.', reverse: true },
              { num: '03', title: 'Detailed Report', desc: 'Receive a comprehensive probability breakdown for your target universities with suggestions for improvement.', reverse: false },
            ].map(step => (
              <div key={step.num} className={`flex flex-col ${step.reverse ? 'md:flex-row-reverse' : 'md:flex-row'} gap-8 items-center`}>
                <div className="flex-shrink-0 w-24 h-24 bg-primary text-white border-[4px] border-brutalist-black flex items-center justify-center text-4xl font-black neobrutal-shadow-black">{step.num}</div>
                <div className="p-8 border-[3px] border-brutalist-black flex-grow bg-white">
                  <h4 className="text-2xl font-black uppercase mb-2">{step.title}</h4>
                  <p className="font-medium opacity-70">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24">
        <div className="max-w-7xl mx-auto h-[300px] border-[4px] border-brutalist-black neobrutal-shadow overflow-hidden relative flex items-center justify-center bg-primary/10">
          <div className="bg-background-light p-8 border-[4px] border-brutalist-black text-center">
            <h2 className="text-3xl font-black uppercase mb-6">Your Journey Starts Here.</h2>
            <Link to="/predict" className="inline-block bg-primary text-white font-black uppercase px-10 py-4 border-[3px] border-brutalist-black neobrutal-shadow-black hover:bg-opacity-90 transition-all">
              Start Prediction
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brutalist-black text-white pt-20 pb-10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-20">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-primary border border-white flex items-center justify-center font-black text-lg">A</div>
                <span className="text-2xl font-black tracking-tighter uppercase">AdmitPredict</span>
              </div>
              <p className="text-xl font-medium text-white/60 max-w-sm mb-8">The ultimate tool for aspiring graduate students to take the guesswork out of applications.</p>
            </div>
            <div>
              <h5 className="font-black uppercase tracking-widest mb-6 text-primary">Platform</h5>
              <ul className="space-y-4 font-bold text-white/70">
                <li><Link className="hover:text-white" to="/predict">Predictor</Link></li>
                <li><Link className="hover:text-white" to="/dashboard">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-black uppercase tracking-widest mb-6 text-primary">Resources</h5>
              <ul className="space-y-4 font-bold text-white/70">
                <li><a className="hover:text-white" href="#">Help Center</a></li>
                <li><a className="hover:text-white" href="#">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-10 flex flex-col md:flex-row justify-between items-center gap-6 text-sm font-bold text-white/40 uppercase tracking-widest">
            <p>© 2024 AdmitPredict. Built for the ambitious.</p>
            <p>Designed with Grit.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
