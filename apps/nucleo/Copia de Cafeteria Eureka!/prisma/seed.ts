import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Cafés Especiales',
        description: 'Nuestras mejores selecciones de café'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Bebidas Calientes',
        description: 'Bebidas calientes para cualquier momento'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Bebidas Frías',
        description: 'Refrescantes bebidas frías'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Pasteles y Postres',
        description: 'Deliciosos acompañamientos'
      }
    })
  ])

  // Create products
  const products = await Promise.all([
    // Cafés Especiales
    prisma.product.create({
      data: {
        name: 'Espresso Clásico',
        description: 'Intenso y aromático, el corazón de nuestra cafetería',
        price: 2.50,
        available: true,
        featured: true,
        stock: 50,
        categoryId: categories[0].id
      }
    }),
    prisma.product.create({
      data: {
        name: 'Americano',
        description: 'Espresso suavizado con agua caliente',
        price: 2.00,
        available: true,
        featured: false,
        stock: 30,
        categoryId: categories[0].id
      }
    }),
    prisma.product.create({
      data: {
        name: 'Cortado',
        description: 'Espresso con una pequeña cantidad de leche',
        price: 2.75,
        available: true,
        featured: false,
        stock: 25,
        categoryId: categories[0].id
      }
    }),

    // Bebidas Calientes
    prisma.product.create({
      data: {
        name: 'Cappuccino Crema',
        description: 'Suave espuma con el equilibrio perfecto de café y leche',
        price: 3.50,
        available: true,
        featured: true,
        stock: 40,
        categoryId: categories[1].id
      }
    }),
    prisma.product.create({
      data: {
        name: 'Latte Especiado',
        description: 'Nuestro latte con un toque de canela y nuez moscada',
        price: 4.00,
        available: true,
        featured: true,
        stock: 35,
        categoryId: categories[1].id
      }
    }),
    prisma.product.create({
      data: {
        name: 'Mocha',
        description: 'Latte con chocolate y un toque de crema',
        price: 4.25,
        available: true,
        featured: false,
        stock: 20,
        categoryId: categories[1].id
      }
    }),

    // Bebidas Frías
    prisma.product.create({
      data: {
        name: 'Cold Brew',
        description: 'Café frío infusionado por 24 horas',
        price: 3.75,
        available: true,
        featured: true,
        stock: 15,
        categoryId: categories[2].id
      }
    }),
    prisma.product.create({
      data: {
        name: 'Iced Latte',
        description: 'Latte servido sobre hielo',
        price: 3.50,
        available: true,
        featured: false,
        stock: 25,
        categoryId: categories[2].id
      }
    }),
    prisma.product.create({
      data: {
        name: 'Frappé',
        description: 'Bebida de café helada y cremosa',
        price: 4.50,
        available: true,
        featured: false,
        stock: 8, // Low stock for testing
        categoryId: categories[2].id
      }
    }),

    // Pasteles y Postres
    prisma.product.create({
      data: {
        name: 'Croissant',
        description: 'Hojaldre fresco y crujiente',
        price: 2.25,
        available: true,
        featured: false,
        stock: 20,
        categoryId: categories[3].id
      }
    }),
    prisma.product.create({
      data: {
        name: 'Muffin de Arándanos',
        description: 'Esponjoso muffin con arándanos frescos',
        price: 2.75,
        available: true,
        featured: false,
        stock: 12,
        categoryId: categories[3].id
      }
    }),
    prisma.product.create({
      data: {
        name: 'Pastel de Queso',
        description: 'Cremoso pastel de queso con base de galleta',
        price: 3.50,
        available: true,
        featured: true,
        stock: 5, // Low stock for testing
        categoryId: categories[3].id
      }
    })
  ])

  // Create a sample user and customer
  const user = await prisma.user.create({
    data: {
      email: 'customer@example.com',
      name: 'Cliente Ejemplo',
      password: 'password123', // Temporary password for demo
      role: 'CUSTOMER'
    }
  })

  const customer = await prisma.customer.create({
    data: {
      userId: user.id,
      loyaltyPoints: 0
    }
  })

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Administrador',
      password: 'admin123', // Temporary password for demo
      role: 'ADMIN'
    }
  })

  const admin = await prisma.admin.create({
    data: {
      userId: adminUser.id,
      permissions: 'all'
    }
  })

  // Create loyalty rewards
  const rewards = await Promise.all([
    prisma.loyaltyReward.create({
      data: {
        name: 'Café Gratis',
        description: 'Un café de tu elección gratis',
        pointsRequired: 50,
        available: true,
        customerId: customer.id
      }
    }),
    prisma.loyaltyReward.create({
      data: {
        name: 'Descuento 20%',
        description: '20% de descuento en tu próxima compra',
        pointsRequired: 100,
        available: true,
        customerId: customer.id
      }
    }),
    prisma.loyaltyReward.create({
      data: {
        name: 'Desayuno Especial',
        description: 'Café + croissant gratis',
        pointsRequired: 150,
        available: true,
        customerId: customer.id
      }
    })
  ])

  console.log('Database seeded successfully!')
  console.log(`Created ${categories.length} categories`)
  console.log(`Created ${products.length} products`)
  console.log(`Created ${rewards.length} loyalty rewards`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })