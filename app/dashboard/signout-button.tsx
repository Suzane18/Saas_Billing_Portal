"use client"

import { signOut } from 'next-auth/react'

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/auth/login' })}
      className="inline-flex items-center px-4 py-2 bg-white border rounded-md text-sky-700 hover:bg-sky-50"
    >
      Sign out
    </button>
  )
}
