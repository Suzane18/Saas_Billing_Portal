import NextAuth, { DefaultSession } from 'next-auth'
import { JWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      role?: 'USER' | 'ADMIN'
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: 'USER' | 'ADMIN'
  }
}
