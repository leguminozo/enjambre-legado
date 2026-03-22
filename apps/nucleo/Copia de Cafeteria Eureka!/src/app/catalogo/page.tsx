'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCartStore } from '@/lib/cart-store'
import { Coffee, Search, Star, ShoppingCart } from "lucide-react"
import { Logo } from "@/components/ui/logo"

interface Product {
  id: string
  name: string
  description: string
  price: number
  image?: string
  available: boolean
  featured: boolean
  category: {
    id: string
    name: string
  }
}

interface Category {
  id: string
  name: string
  description?: string
  image?: string
  products: Product[]
}

export default function CatalogPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const addItem = useCartStore((state) => state.addItem)
  const getTotalItems = useCartStore((state) => state.getTotalItems)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    filterProducts()
  }, [products, searchTerm, selectedCategory])

  const fetchData = async () => {
    try {
      // Datos de ejemplo para el catálogo
      const productsData: Product[] = [
        {
          id: '1',
          name: 'Café Colombiano Premium',
          description: 'Café de altura con notas frutales y chocolate',
          price: 4.50,
          available: true,
          featured: true,
          category: { id: 'coffee', name: 'Café de Especialidad' }
        },
        {
          id: '2',
          name: 'Café Guatemalteco Antigua',
          description: 'Café suave con notas de caramelo y especias',
          price: 4.00,
          available: true,
          featured: false,
          category: { id: 'coffee', name: 'Café de Especialidad' }
        },
        {
          id: '3',
          name: 'Croissant de Mantequilla',
          description: 'Croissant clásico francés horneado diariamente',
          price: 3.50,
          available: true,
          featured: true,
          category: { id: 'pastry', name: 'Repostería de Autor' }
        },
        {
          id: '4',
          name: 'Tarta de Manzana',
          description: 'Tarta casera con manzanas frescas y canela',
          price: 5.00,
          available: true,
          featured: false,
          category: { id: 'pastry', name: 'Repostería de Autor' }
        },
        {
          id: '5',
          name: 'Jugo de Naranja Natural',
          description: 'Jugo fresco exprimido al momento',
          price: 3.00,
          available: true,
          featured: false,
          category: { id: 'juice', name: 'Jugos Naturales' }
        },
        {
          id: '6',
          name: 'Smoothie de Frutos Rojos',
          description: 'Mezcla de fresas, frambuesas y moras',
          price: 4.50,
          available: true,
          featured: true,
          category: { id: 'juice', name: 'Jugos Naturales' }
        }
      ]

      const categoriesData: Category[] = [
        {
          id: 'coffee',
          name: 'Café de Especialidad',
          description: 'Cafés únicos de diferentes regiones',
          products: productsData.filter(product => product.category.id === 'coffee')
        },
        {
          id: 'pastry',
          name: 'Repostería de Autor',
          description: 'Dulces y pasteles artesanales',
          products: productsData.filter(product => product.category.id === 'pastry')
        },
        {
          id: 'juice',
          name: 'Jugos Naturales',
          description: 'Jugos frescos y saludables',
          products: productsData.filter(product => product.category.id === 'juice')
        }
      ]

      setCategories(categoriesData)
      setProducts(productsData)
      setLoading(false)
    } catch (error) {
      console.error('Error setting up catalog data:', error)
      setCategories([])
      setProducts([])
      setLoading(false)
    }
  }

  const filterProducts = () => {
    let filtered = products

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category.id === selectedCategory)
    }

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredProducts(filtered)
  }

  const addToCart = (product: Product) => {
    addItem({
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image,
      productId: product.id
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen eureka-theme flex items-center justify-center">
        <div className="text-center">
          <Logo size="xl" variant="dark-theme" className="mx-auto mb-4 eureka-loading" />
          <p className="eureka-text-secondary">Cargando catálogo...</p>
        </div>
      </div>
    )
  }

  // Mostrar mensaje de error si no hay datos
  if (!Array.isArray(categories) || !Array.isArray(products)) {
    return (
      <div className="min-h-screen eureka-theme">
        <div className="eureka-container px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="eureka-card p-6 max-w-md mx-auto border-red-500/30">
              <Logo size="xl" variant="dark-theme" className="mx-auto mb-4" />
              <h3 className="text-xl font-semibold eureka-title mb-2">Error al cargar datos</h3>
              <p className="eureka-text-secondary mb-4">No se pudieron cargar las categorías o productos.</p>
              <Button onClick={fetchData} variant="outline" className="eureka-btn-outline">
                Intentar de nuevo
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen eureka-theme">
      {/* Header */}
      <header className="eureka-header">
        <div className="eureka-container px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center eureka-spacing">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2">
                <Logo size="md" variant="dark-theme" />
              </Link>
            </div>
            <Link href="/fidelizacion">
              <Button variant="outline" className="eureka-btn-outline">
                Club de Fidelización
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Header Section */}
      <section className="eureka-spacing-large px-4">
        <div className="eureka-container text-center">
          <h1 className="eureka-title-large mb-4">Nuestro Catálogo</h1>
          <p className="eureka-text-secondary max-w-2xl mx-auto">
            Descubre nuestra selección de cafés de especialidad, repostería de autor y jugos naturales en Eureka!
          </p>
        </div>
      </section>

      {/* Search and Filter */}
      <section className="py-8 px-4 eureka-card mx-4 rounded-lg">
        <div className="eureka-container">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 eureka-text-muted" />
              <Input
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 eureka-input"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48 eureka-input">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent className="eureka-dialog">
                <SelectItem value="all">Todas las categorías</SelectItem>
                {Array.isArray(categories) && categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16 px-4">
        <div className="eureka-container">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Logo size="xl" variant="dark-theme" className="mx-auto mb-4" />
              <h3 className="text-xl font-semibold eureka-title mb-2">No se encontraron productos</h3>
              <p className="eureka-text-secondary">Intenta ajustar tu búsqueda o filtros</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.isArray(filteredProducts) && filteredProducts.map((product) => (
                <Card key={product.id} className="hover:shadow-lg transition-shadow eureka-card">
                  <CardHeader>
                    <div className="w-full h-48 bg-gradient-to-br from-amber-200 to-amber-400 rounded-lg mb-4 relative">
                      {product.featured && (
                        <Badge className="absolute top-2 right-2 eureka-badge-success">
                          <Star className="w-3 h-3 mr-1" />
                          Destacado
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="flex items-center gap-2 eureka-title">
                      {product.name}
                    </CardTitle>
                    <CardDescription className="text-sm eureka-text-secondary">
                      {product.category.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm eureka-text-secondary mb-4 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold eureka-icon">
                        ${product.price.toFixed(2)}
                      </span>
                      <Button 
                        size="sm" 
                        onClick={() => addToCart(product)}
                        className="eureka-btn-primary"
                      >
                        Añadir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 px-4">
        <div className="eureka-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold eureka-title mb-4">Explora por Categorías</h2>
            <p className="eureka-text-secondary">Navega por nuestras diferentes categorías de productos</p>
          </div>
          
          <Tabs defaultValue={Array.isArray(categories) && categories.length > 0 ? categories[0]?.id : undefined} className="w-full">
            <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 lg:grid-cols-4 eureka-tabs">
              {Array.isArray(categories) && categories.map((category) => (
                <TabsTrigger key={category.id} value={category.id} className="eureka-tab">
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
            {Array.isArray(categories) && categories.map((category) => (
              <TabsContent key={category.id} value={category.id} className="mt-8">
                <div className="eureka-grid-cards">
                  {Array.isArray(category.products) && category.products.map((product) => (
                    <Card key={product.id} className="hover:shadow-lg transition-shadow eureka-card">
                      <CardHeader>
                        <div className="w-full h-40 bg-gradient-to-br from-amber-200 to-amber-400 rounded-lg mb-4"></div>
                        <CardTitle className="text-lg eureka-title">{product.name}</CardTitle>
                        <CardDescription className="eureka-text-secondary">{product.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center">
                          <span className="text-xl font-bold eureka-icon">
                            ${product.price.toFixed(2)}
                          </span>
                          <Button 
                            size="sm" 
                            onClick={() => addToCart(product)}
                            className="eureka-btn-primary"
                          >
                            Añadir
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>
    </div>
  )
}