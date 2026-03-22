'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuthStore } from '@/lib/auth-store'
import { 
  Coffee, 
  Package, 
  Users, 
  ShoppingCart, 
  Star, 
  Settings, 
  LogOut,
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  ArrowLeft
} from "lucide-react"

interface DashboardStats {
  totalProducts: number
  totalCustomers: number
  totalOrders: number
  totalRevenue: number
  recentOrders: any[]
  lowStockProducts: any[]
}

export default function AdminPage() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalCustomers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    recentOrders: [],
    lowStockProducts: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      window.location.href = '/login'
      return
    }
    fetchDashboardStats()
  }, [isAuthenticated, user])

  const fetchDashboardStats = async () => {
    try {
      const [productsRes, customersRes, ordersRes] = await Promise.all([
        fetch('/api/admin/products'),
        fetch('/api/admin/customers'),
        fetch('/api/admin/orders')
      ])

      const products = await productsRes.json()
      const customers = await customersRes.json()
      const orders = await ordersRes.json()

      const totalRevenue = orders.reduce((sum: number, order: any) => sum + order.totalAmount, 0)
      const recentOrders = orders.slice(0, 5)
      const lowStockProducts = products.filter((p: any) => p.stock < 10).slice(0, 5)

      setStats({
        totalProducts: products.length,
        totalCustomers: customers.length,
        totalOrders: orders.length,
        totalRevenue,
        recentOrders,
        lowStockProducts
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    localStorage.removeItem('customer')
    window.location.href = '/'
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-center">
          <Coffee className="w-16 h-16 text-amber-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
          <p className="text-gray-600 mb-4">No tienes permisos para acceder al panel de administración</p>
          <Link href="/">
            <Button className="bg-amber-600 hover:bg-amber-700">
              Volver al Inicio
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-center">
          <Coffee className="w-16 h-16 text-amber-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Cargando panel de administración...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2">
                <Coffee className="w-8 h-8 text-amber-600" />
                <span className="text-xl font-bold text-gray-900">Café Aroma Admin</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Bienvenido, {user?.name || user?.email}
              </span>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground">Productos en catálogo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCustomers}</div>
              <p className="text-xs text-muted-foreground">Clientes registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pedidos</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">Pedidos realizados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Ingresos generados</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>
              Gestiona rápidamente los aspectos más importantes de tu cafetería
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/admin/products">
                <Button className="w-full h-20 flex flex-col gap-2" variant="outline">
                  <Package className="w-6 h-6" />
                  <span className="text-sm">Productos</span>
                </Button>
              </Link>
              <Link href="/admin/categories">
                <Button className="w-full h-20 flex flex-col gap-2" variant="outline">
                  <Coffee className="w-6 h-6" />
                  <span className="text-sm">Categorías</span>
                </Button>
              </Link>
              <Link href="/admin/orders">
                <Button className="w-full h-20 flex flex-col gap-2" variant="outline">
                  <ShoppingCart className="w-6 h-6" />
                  <span className="text-sm">Pedidos</span>
                </Button>
              </Link>
              <Link href="/admin/customers">
                <Button className="w-full h-20 flex flex-col gap-2" variant="outline">
                  <Users className="w-6 h-6" />
                  <span className="text-sm">Clientes</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="orders">Pedidos Recientes</TabsTrigger>
            <TabsTrigger value="stock">Productos con Bajo Stock</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Pedidos Recientes</CardTitle>
                <CardDescription>
                  Últimos 5 pedidos realizados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats.recentOrders.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No hay pedidos recientes</p>
                ) : (
                  <div className="space-y-4">
                    {stats.recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">Pedido #{order.id.slice(-8)}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${order.totalAmount.toFixed(2)}</p>
                          <Badge variant={order.status === 'COMPLETED' ? 'default' : 'secondary'}>
                            {order.status === 'COMPLETED' ? 'Completado' : order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stock" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Productos con Bajo Stock</CardTitle>
                <CardDescription>
                  Productos con menos de 10 unidades en stock
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats.lowStockProducts.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No hay productos con bajo stock</p>
                ) : (
                  <div className="space-y-4">
                    {stats.lowStockProducts.map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-600">{product.category.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-red-600">{product.stock} unidades</p>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}