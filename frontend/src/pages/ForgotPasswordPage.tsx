import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthCard } from '../components/ui/AuthCard'
import { apiRequest } from '../services/api'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      const response = await apiRequest<{ success: true; message: string }>(
        '/auth/forgot-password',
        { method: 'POST', body: JSON.stringify({ email }) },
      )
      setMessage(response.message)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to request a reset link',
      )
    } finally {
      setIsSubmitting(false)
    }
  }
  return (
    <AuthCard title="Reset your password">
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
        {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
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
          {isSubmitting ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
      <Link
        className="mt-6 inline-block text-sm font-semibold text-violet-300 hover:text-violet-200"
        to="/login"
      >
        Back to sign in
      </Link>
    </AuthCard>
  )
}
