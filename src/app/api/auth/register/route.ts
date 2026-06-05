import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import prisma from '@/src/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(password, 10)

    await prisma.user.create({ data: { name: name ?? null, email, password: hashed } })

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err: any) {
    console.error('[REGISTER] Error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
