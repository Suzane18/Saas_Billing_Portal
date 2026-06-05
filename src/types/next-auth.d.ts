import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role?: 'USER' | 'ADMIN'
    } & DefaultSession['user']
  }

  interface User {
    id: string
    email: string
    name?: string | null
    image?: string | null
    role?: 'USER' | 'ADMIN'
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    email?: string
    role?: 'USER' | 'ADMIN'
  }
}

