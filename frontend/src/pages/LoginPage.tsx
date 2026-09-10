import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { AuthCard } from '../components/ui/AuthCard'
import { useAuthStore } from '../store/authStore'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((state) => state.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const searchParams = new URLSearchParams(location.search)
  const redirect = searchParams.get('redirect') || '/workspace'

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await login({ email, password })
      navigate(redirect, { replace: true })
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to sign in',
      )
    } finally {
      setIsSubmitting(false)
    }
  }
  return (
    <AuthCard title="Sign in to your workspace">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium">
          Email
          <input
            className="mt-1 w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
          />
        </label>
        <label className="block text-sm font-medium">
          Password
          <input
            className="mt-1 w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
        {error ? (
          <p role="alert" className="text-sm text-rose-300">
            {error}
          </p>
        ) : null}
        <button
          className="w-full rounded bg-violet-600 px-4 py-2 font-semibold hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <div className="mt-6 flex flex-col gap-2 text-sm">
        <Link
          className="font-semibold text-violet-300 hover:text-violet-200"
          to="/forgot-password"
        >
          Forgot your password?
        </Link>
        <Link
          className="font-semibold text-violet-300 hover:text-violet-200"
          to={`/signup${searchParams.toString() ? `?${searchParams.toString()}` : ''}`}
        >
          Need an account? Sign up
        </Link>
      </div>
    </AuthCard>
  )
}
