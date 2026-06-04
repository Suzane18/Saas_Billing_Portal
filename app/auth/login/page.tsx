"use client"

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await signIn('credentials', { redirect: false, email, password })
    setLoading(false)

    if (res?.error) {
      setError(res.error)
      return
    }

    router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-md p-6 rounded-lg shadow-lg bg-gradient-to-b from-sky-50 to-white">
        <h1 className="text-2xl font-semibold text-sky-700 mb-4">Sign in</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-sky-600">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:ring-sky-400 focus:border-sky-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-sky-600">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:ring-sky-400 focus:border-sky-400"
            />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center rounded-md bg-sky-600 text-white px-4 py-2 hover:bg-sky-700 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>

        <p className="mt-4 text-sm text-sky-600">
          Don&apos;t have an account? <a href="/auth/register" className="font-medium text-sky-700">Register</a>
        </p>
      </div>
    </div>
  )
}
