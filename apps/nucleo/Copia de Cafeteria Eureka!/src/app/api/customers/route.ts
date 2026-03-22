export const dynamic = "force-static";
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { email, name, phone, address } = await request.json()

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Create user with temporary password
    const user = await db.user.create({
      data: {
        email,
        name,
        password: 'temp123', // Temporary password, should be changed by user
        role: 'CUSTOMER'
      }
    })

    // Create customer profile
    const customer = await db.customer.create({
      data: {
        userId: user.id,
        phone,
        address,
        loyaltyPoints: 0
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { error: 'Error creating customer' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const customer = await db.customer.findFirst({
      where: {
        user: {
          email
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        orders: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        },
        loyaltyRewards: {
          where: {
            available: true
          }
        }
      }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json(
      { error: 'Error fetching customer' },
      { status: 500 }
    )
  }
}