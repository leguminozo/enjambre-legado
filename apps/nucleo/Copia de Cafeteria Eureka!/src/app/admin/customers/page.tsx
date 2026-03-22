'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from '@/lib/auth-store'
import { 
  Users, 
  ArrowLeft, 
  Search, 
  Star,
  MapPin,
  Phone,
  Mail,
  Calendar,
  ShoppingCart,
  Eye
} from "lucide-react"

interface Customer {
  id: string
  userId: string
  phone?: string
  address?: string
  loyaltyPoints: number
  createdAt: string
  user: {
    id: string
    email: string
    name?: string
    createdAt: string
  }
  orders: {
    id: string
    totalAmount: number
    status: string
    createdAt: string
  }[]
}

export default function AdminCustomersPage() {
  const { user, isAuthenticated } = useAuthStore()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      window.location.href = '/login'
      return
    }
    fetchCustomers()
  }, [isAuthenticated, user])

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/admin/customers')
      const customersData = await response.json()
      setCustomers(customersData)
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchTerm.toLowerCase()
    return (
      customer.user.name?.toLowerCase().includes(searchLower) ||
      customer.user.email.toLowerCase().includes(searchLower) ||
      customer.phone?.toLowerCase().includes(searchLower) ||
      customer.address?.toLowerCase().includes(searchLower)
    )
  })

  const getTotalSpent = (orders: Customer['orders']) => {
    return orders.reduce((sum, order) => sum + order.totalAmount, 0)
  }

  const getCompletedOrders = (orders: Customer['orders']) => {
    return orders.filter(order => order.status === 'COMPLETED').length
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-center">
          <Users className="w-16 h-16 text-amber-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
          <p className="text-gray-600 mb-4">No tienes permisos para acceder a esta página</p>
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
          <Users className="w-16 h-16 text-amber-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Cargando clientes...</p>
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
              <Link href="/admin" className="flex items-center gap-2">
                <ArrowLeft className="w-5 h-5" />
                <span className="text-lg font-semibold">Volver al Panel</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Administrador: {user?.name || user?.email}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
            <p className="text-gray-600">Gestiona los clientes de tu cafetería</p>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customers.length}</div>
              <p className="text-xs text-muted-foreground">Clientes registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Puntos Totales</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {customers.reduce((sum, customer) => sum + customer.loyaltyPoints, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Puntos acumulados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos Totales</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {customers.reduce((sum, customer) => sum + customer.orders.length, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Pedidos realizados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${customers.reduce((sum, customer) => sum + getTotalSpent(customer.orders), 0).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Ingresos generados</p>
            </CardContent>
          </Card>
        </div>

        {/* Customers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCustomers.map((customer) => (
            <Card key={customer.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {customer.user.name || 'Sin nombre'}
                      <Badge variant="secondary">
                        <Star className="w-3 h-3 mr-1" />
                        {customer.loyaltyPoints} pts
                      </Badge>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {customer.user.email}
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedCustomer(selectedCustomer?.id === customer.id ? null : customer)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    {selectedCustomer?.id === customer.id ? 'Ocultar' : 'Ver'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    {customer.phone || 'No especificado'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    {customer.address || 'No especificada'}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                    <div>
                      <p className="text-sm text-gray-600">Pedidos</p>
                      <p className="font-semibold">{customer.orders.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Gastado</p>
                      <p className="font-semibold text-amber-600">${getTotalSpent(customer.orders).toFixed(2)}</p>
                    </div>
                  </div>

                  {selectedCustomer?.id === customer.id && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium mb-3">Historial de Pedidos</h4>
                      {customer.orders.length === 0 ? (
                        <p className="text-sm text-gray-500">No hay pedidos</p>
                      ) : (
                        <div className="space-y-2">
                          {customer.orders.slice(0, 3).map((order) => (
                            <div key={order.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <div>
                                <p className="text-sm font-medium">#{order.id.slice(-8)}</p>
                                <p className="text-xs text-gray-600">
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold">${order.totalAmount.toFixed(2)}</p>
                                <Badge 
                                  variant={order.status === 'COMPLETED' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {order.status === 'COMPLETED' ? 'Completado' : order.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                          {customer.orders.length > 3 && (
                            <p className="text-xs text-gray-500 text-center">
                              +{customer.orders.length - 3} pedidos más
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCustomers.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No se encontraron clientes</h3>
              <p className="text-gray-500">
                {searchTerm ? 'No hay clientes que coincidan con tu búsqueda' : 'Aún no hay clientes registrados'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}