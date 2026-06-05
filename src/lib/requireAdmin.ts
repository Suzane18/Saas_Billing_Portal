import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import authOptions from './auth'
import type { Session } from 'next-auth'

export async function requireAdmin(): Promise<Session> {
  const session = (await getServerSession(authOptions as any)) as Session | null
  if (!session?.user) {
    redirect('/auth/login')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return session
}
