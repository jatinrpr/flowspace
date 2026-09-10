import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AuthCard } from '../components/ui/AuthCard'
import { apiRequest } from '../services/api'

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const token = params.get('token') ?? ''
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!token) {
      setError('This password reset link is invalid')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setError(null)
    setIsSubmitting(true)
    try {
      const response = await apiRequest<{ success: true; message: string }>(
        '/auth/reset-password',
        {
          method: 'POST',
          body: JSON.stringify({ token, password, confirmPassword }),
        },
      )
      setMessage(response.message)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to reset password',
      )
    } finally {
      setIsSubmitting(false)
    }
  }
  return (
    <AuthCard title="Choose a new password">
      {message ? (
        <>
          <p className="text-sm text-emerald-300">{message}</p>
          <Link
            className="mt-6 inline-block text-sm font-semibold text-violet-300 hover:text-violet-200"
            to="/login"
          >
            Sign in
          </Link>
        </>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium">
            New password
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500"
              type="password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="new-password"
            />
          </label>
          <label className="block text-sm font-medium">
            Confirm password
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500"
              type="password"
              minLength={8}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              autoComplete="new-password"
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
            {isSubmitting ? 'Resetting…' : 'Reset password'}
          </button>
        </form>
      )}
    </AuthCard>
  )
}
