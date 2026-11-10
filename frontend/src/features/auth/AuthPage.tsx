import type { FormEvent } from 'react'
import type { AuthMode } from '../../types'
import { fieldClass } from '../../shared/ui'

type AuthPageProps = {
  authMode: AuthMode
  setAuthMode: (mode: AuthMode) => void
  email: string
  setEmail: (email: string) => void
  password: string
  setPassword: (password: string) => void
  busy: boolean
  error: string
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  clearError: () => void
}

export function AuthPage({
  authMode,
  setAuthMode,
  email,
  setEmail,
  password,
  setPassword,
  busy,
  error,
  onSubmit,
  clearError,
}: AuthPageProps) {
  const isLogin = authMode === 'login'

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden min-h-screen flex-col overflow-hidden bg-slate-950 px-[8%] py-10 text-white lg:flex">
        <div className="absolute -right-36 -top-32 size-[34rem] rounded-full border border-white/10 shadow-[0_0_0_48px_rgba(255,255,255,0.025),0_0_0_96px_rgba(255,255,255,0.02)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,rgba(124,92,246,0.4),transparent_44%),radial-gradient(ellipse_at_8%_4%,rgba(59,130,246,0.22),transparent_44%)]" />
        <a className="relative z-10 flex w-fit items-center gap-2.5 font-display text-2xl font-extrabold tracking-tight" href="#">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-700 text-xl shadow-lg shadow-violet-950/40">r</span>relay
        </a>
        <div className="relative z-10 my-auto max-w-xl pb-8">
          <div className="flex items-center gap-2.5 text-[11px] font-bold tracking-[0.18em] text-violet-200"><span className="size-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/15" />WEBHOOK OPERATIONS</div>
          <h1 className="mt-7 font-display text-5xl font-bold leading-[1.12] tracking-tight xl:text-6xl">Every event.<br /><span className="text-violet-300">Delivered with clarity.</span></h1>
          <p className="mt-5 max-w-md text-base leading-7 text-slate-300">A calm, reliable workspace for your webhook endpoints and delivery activity.</p>
          <div className="mt-12 flex flex-wrap items-center gap-3 text-xs text-slate-300"><span className="text-lg text-violet-300">↗</span>Secure by design <i className="size-1 rounded-full bg-slate-500" />Real-time visibility <i className="size-1 rounded-full bg-slate-500" />Built for developers</div>
        </div>
        <div className="relative z-10 flex justify-between text-[10px] font-semibold tracking-[0.14em] text-slate-500"><span>WEBHOOK PLATFORM</span><span className="tracking-normal">v1.0</span></div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-6 py-10 sm:px-12">
        <div className="w-full max-w-sm">
          <a className="mb-12 flex w-fit items-center gap-2.5 font-display text-xl font-extrabold tracking-tight text-slate-900 lg:hidden" href="#">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-700 text-xl text-white">r</span>relay
          </a>
          <p className="text-[11px] font-bold tracking-[0.16em] text-violet-600">WELCOME {isLogin ? 'BACK' : 'ABOARD'}</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900">{isLogin ? 'Sign in to Relay' : 'Create your account'}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Manage endpoints and keep an eye on every delivery.</p>

          {error && <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{error}</div>}

          <form className="mt-8 grid gap-5" onSubmit={onSubmit}>
            <label className="grid gap-2 text-sm font-medium text-slate-700">Email address
              <input className={fieldClass} type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">Password
              <input className={fieldClass} type="password" autoComplete={isLogin ? 'current-password' : 'new-password'} minLength={isLogin ? 1 : 12} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" />
            </label>
            {!isLogin && <p className="-mt-3 text-xs text-slate-500">Use at least 12 characters. Your password is securely hashed.</p>}
            <button className="mt-1 flex h-12 items-center justify-center gap-3 rounded-lg bg-violet-600 px-4 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60" disabled={busy}>
              {busy ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}<span className="ml-auto text-lg">→</span>
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-500">{isLogin ? 'New to Relay?' : 'Already have an account?'}
            <button className="ml-1 font-semibold text-violet-700 hover:text-violet-800" onClick={() => { setAuthMode(isLogin ? 'register' : 'login'); clearError() }}>{isLogin ? 'Create account' : 'Sign in'}</button>
          </p>
          <p className="mt-9 border-t border-slate-100 pt-5 text-center text-xs leading-5 text-slate-500"><span className="mr-1 text-violet-600">◇</span>Your workspace is private and protected by encrypted sessions.</p>
        </div>
      </section>
    </main>
  )
}
