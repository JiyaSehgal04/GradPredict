import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser, loginUser } from '../lib/auth'

function friendlyError(msg = '') {
  const m = msg.toLowerCase()
  if (m.includes('too many') || m.includes('rate limit'))
    return 'Too many attempts — please wait a few minutes and try again.'
  if (m.includes('already exists'))
    return 'An account with this email already exists. Try signing in instead.'
  if (m.includes('incorrect email or password'))
    return 'Incorrect email or password.'
  return msg
}

export default function Login() {
  const [mode, setMode]           = useState('signin')
  const [name, setName]           = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (localStorage.getItem('admitPredict_user')) navigate('/dashboard')
  }, [navigate])

  function switchMode(m) {
    setMode(m)
    setError('')
    setPassword('')
    setConfirmPw('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email.trim() || !emailPattern.test(email.trim())) {
      setError('Please enter a valid email address.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (mode === 'signup') {
      if (!name.trim()) { setError('Please enter your full name.'); return }
      if (password !== confirmPw) { setError('Passwords do not match.'); return }
    }

    setLoading(true)
    try {
      let user
      if (mode === 'signup') {
        user = await registerUser(name.trim(), email.trim(), password)
      } else {
        user = await loginUser(email.trim(), password)
      }
      localStorage.setItem('admitPredict_user', JSON.stringify({
        name: user.name,
        email: user.email,
        joinedAt: Date.now(),
      }))
      navigate('/dashboard')
    } catch (err) {
      setError(friendlyError(err.message))
    } finally {
      setLoading(false)
    }
  }

  const isSignup = mode === 'signup'

  return (
    <div className="bg-background-light font-display text-brutalist-black min-h-screen flex items-center justify-center py-16 px-4">
      <div className="fixed top-16 -left-12 w-48 h-48 bg-primary/20 neo-border rotate-12 -z-10 pointer-events-none" />
      <div className="fixed bottom-16 -right-12 w-36 h-36 bg-primary/20 neo-border -rotate-45 -z-10 pointer-events-none" />

      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 font-black uppercase text-sm tracking-widest hover:text-primary transition-colors mb-8">
          <span className="material-icons text-sm">arrow_back</span> Back to Home
        </Link>

        <div className="bg-white neo-border neo-shadow p-10">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-primary neo-border flex items-center justify-center text-white font-black text-xl">A</div>
              <span className="text-2xl font-black tracking-tighter uppercase">AdmitPredict</span>
            </Link>

            <div className="flex neo-border overflow-hidden mb-6">
              <button type="button" onClick={() => switchMode('signin')}
                className={`flex-1 py-3 font-black uppercase text-sm tracking-widest transition-colors ${!isSignup ? 'bg-primary text-white' : 'bg-white text-brutalist-black hover:bg-primary/10'}`}>
                Sign In
              </button>
              <button type="button" onClick={() => switchMode('signup')}
                className={`flex-1 py-3 font-black uppercase text-sm tracking-widest transition-colors border-l-2 border-brutalist-black ${isSignup ? 'bg-primary text-white' : 'bg-white text-brutalist-black hover:bg-primary/10'}`}>
                Sign Up
              </button>
            </div>

            <p className="font-bold text-brutalist-black/50 uppercase text-xs tracking-widest">
              {isSignup ? 'Create your account to save predictions' : 'Welcome back — sign in to continue'}
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            {isSignup && (
              <div className="space-y-2">
                <label className="block font-black uppercase text-sm tracking-widest" htmlFor="name">Full Name</label>
                <input id="name" type="text" placeholder="e.g. Alex Johnson" autoComplete="name"
                  value={name} onChange={e => setName(e.target.value)}
                  className="w-full neo-input p-4 font-bold text-lg transition-all block" />
              </div>
            )}

            <div className="space-y-2">
              <label className="block font-black uppercase text-sm tracking-widest" htmlFor="email">Email Address</label>
              <input id="email" type="email" placeholder="you@university.edu" autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)}
                className="w-full neo-input p-4 font-bold text-lg transition-all block" />
            </div>

            <div className="space-y-2">
              <label className="block font-black uppercase text-sm tracking-widest" htmlFor="password">Password</label>
              <div className="relative">
                <input id="password" type={showPw ? 'text' : 'password'}
                  placeholder={isSignup ? 'Min. 6 characters' : '••••••••'}
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full neo-input p-4 pr-14 font-bold text-lg transition-all block" />
                <button type="button" tabIndex={-1} onClick={() => setShowPw(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-brutalist-black/40 hover:text-primary transition-colors">
                  <span className="material-icons text-xl">{showPw ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            {isSignup && (
              <div className="space-y-2">
                <label className="block font-black uppercase text-sm tracking-widest" htmlFor="confirmPw">Confirm Password</label>
                <input id="confirmPw" type={showPw ? 'text' : 'password'} placeholder="Re-enter password"
                  autoComplete="new-password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                  className="w-full neo-input p-4 font-bold text-lg transition-all block" />
              </div>
            )}

            {error && (
              <div className="bg-red-500 text-white p-3 border-2 border-brutalist-black flex items-center gap-2">
                <span className="material-icons text-sm">error</span>
                <span className="font-bold text-xs uppercase">{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-primary text-white neo-border neo-shadow py-5 font-black text-xl uppercase tracking-widest hover:opacity-90 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-60">
              {loading
                ? (isSignup ? 'Creating account…' : 'Signing in…')
                : <>{isSignup ? 'Create Account' : 'Sign In'} <span className="material-icons">arrow_forward</span></>
              }
            </button>
          </form>

          <div className="mt-8 border-t-2 border-brutalist-black/10 pt-6 text-center">
            <Link to="/predict" className="font-bold text-sm hover:text-primary transition-colors underline underline-offset-4">
              Skip — predict as guest
            </Link>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          {[
            { icon: 'history',  label: 'Save History' },
            { icon: 'download', label: 'Download Reports' },
            { icon: 'compare',  label: 'Compare Unis' },
          ].map(f => (
            <div key={f.label} className="bg-white neo-border p-4">
              <span className="material-icons text-primary text-2xl mb-1 block">{f.icon}</span>
              <p className="text-xs font-black uppercase">{f.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
