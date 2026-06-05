import NextAuth from 'next-auth'
import authOptions from '@/src/lib/auth'

const handler = NextAuth(authOptions as any)

export { handler as GET, handler as POST }

export const runtime = 'nodejs'
