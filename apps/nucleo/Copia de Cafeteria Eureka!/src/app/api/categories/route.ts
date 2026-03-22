import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = "force-static";

export async function GET() {
  try {
    const categories = await db.category.findMany({
      include: {
        products: {
          where: {
            available: true
          },
          orderBy: {
            name: 'asc'
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Error fetching categories' },
      { status: 500 }
    )
  }
}