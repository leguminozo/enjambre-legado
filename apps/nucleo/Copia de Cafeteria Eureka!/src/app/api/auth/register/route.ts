export const dynamic = "force-static";
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, phone, address } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Nombre, email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 409 }
      )
    }

    // Hash password (for demo purposes, we'll skip this)
    // const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await db.user.create({
      data: {
        email,
        name,
        // password: hashedPassword,
        password: password, // For demo purposes
        role: 'CUSTOMER'
      }
    })

    // Create customer record
    const customer = await db.customer.create({
      data: {
        userId: user.id,
        phone,
        address,
        loyaltyPoints: 0
      }
    })

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      ...userWithoutPassword,
      customer
    })
  } catch (error) {
    console.error('Error in registration:', error)
    return NextResponse.json(
      { error: 'Error al registrar usuario' },
      { status: 500 }
    )
  }
}