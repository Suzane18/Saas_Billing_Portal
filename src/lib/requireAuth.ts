import { Session } from 'next-auth'
import { getServerSession } from 'next-auth/next'
import authOptions from './auth'
import { redirect } from 'next/navigation'

export async function requireUser() {
  const session = (await getServerSession(authOptions as any)) as Session | null
  if (!session?.user) {
    redirect('/auth/login')
  }
  return session
}
