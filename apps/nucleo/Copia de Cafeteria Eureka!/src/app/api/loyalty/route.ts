export const dynamic = "force-static";
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { customerId, points, action } = await request.json()

    const customer = await db.customer.findUnique({
      where: { id: customerId }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    let updatedPoints = customer.loyaltyPoints

    if (action === 'add') {
      updatedPoints += points
    } else if (action === 'redeem') {
      if (customer.loyaltyPoints < points) {
        return NextResponse.json(
          { error: 'Insufficient points' },
          { status: 400 }
        )
      }
      updatedPoints -= points
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    const updatedCustomer = await db.customer.update({
      where: { id: customerId },
      data: { loyaltyPoints: updatedPoints },
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

    return NextResponse.json(updatedCustomer)
  } catch (error) {
    console.error('Error updating loyalty points:', error)
    return NextResponse.json(
      { error: 'Error updating loyalty points' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      )
    }

    const customer = await db.customer.findUnique({
      where: { id: customerId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
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
    console.error('Error fetching customer loyalty data:', error)
    return NextResponse.json(
      { error: 'Error fetching customer loyalty data' },
      { status: 500 }
    )
  }
}