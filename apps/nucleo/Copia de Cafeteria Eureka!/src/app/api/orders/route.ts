export const dynamic = "force-static";
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { customerId, items, totalAmount } = await request.json()

    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Invalid order data' },
        { status: 400 }
      )
    }

    // Calculate loyalty points (1 point per dollar)
    const loyaltyPointsEarned = Math.floor(totalAmount)

    // Create order
    const order = await db.order.create({
      data: {
        customerId,
        status: 'PENDING',
        totalAmount,
        loyaltyPointsEarned,
        orderItems: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
          }))
        }
      },
      include: {
        orderItems: {
          include: {
            product: true
          }
        },
        customer: {
          include: {
            user: true
          }
        }
      }
    })

    // Update customer loyalty points
    await db.customer.update({
      where: { id: customerId },
      data: {
        loyaltyPoints: {
          increment: loyaltyPointsEarned
        }
      }
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Error creating order' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')

    const where = customerId ? { customerId } : {}

    const orders = await db.order.findMany({
      where,
      include: {
        orderItems: {
          include: {
            product: true
          }
        },
        customer: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Error fetching orders' },
      { status: 500 }
    )
  }
}