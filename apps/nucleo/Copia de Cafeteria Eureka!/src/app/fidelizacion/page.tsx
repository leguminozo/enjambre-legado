'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useAuthStore } from '@/lib/auth-store'
import { Coffee, Star, Gift, ArrowLeft, User, Phone, MapPin, Trophy, CreditCard } from "lucide-react"
import { Logo } from "@/components/ui/logo"

interface Customer {
  id: string
  userId: string
  phone?: string
  address?: string
  loyaltyPoints: number
  user: {
    id: string
    email: string
    name?: string
  }
}

interface LoyaltyReward {
  id: string
  name: string
  description: string
  pointsRequired: number
  available: boolean
}

interface Order {
  id: string
  status: string
  totalAmount: number
  createdAt: string
  loyaltyPointsEarned: number
}

export default function LoyaltyPage() {
  const { isAuthenticated, user, login } = useAuthStore()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [rewards, setRewards] = useState<LoyaltyReward[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  })
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: ''
  })

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchCustomerData()
    }
    fetchRewards()
  }, [isAuthenticated, user])

  const fetchCustomerData = async () => {
    try {
      const response = await fetch(`/api/customers?userId=${user?.id}`)
      if (response.ok) {
        const customerData = await response.json()
        setCustomer(customerData)
        localStorage.setItem('customer', JSON.stringify(customerData))
        fetchOrders(customerData.id)
      }
    } catch (error) {
      console.error('Error fetching customer data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRewards = async () => {
    try {
      const response = await fetch('/api/loyalty')
      if (response.ok) {
        const rewardsData = await response.json()
        setRewards(rewardsData)
      }
    } catch (error) {
      console.error('Error fetching rewards:', error)
    }
  }

  const fetchOrders = async (customerId: string) => {
    try {
      const response = await fetch(`/api/orders?customerId=${customerId}`)
      if (response.ok) {
        const ordersData = await response.json()
        setOrders(ordersData)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginForm),
      })

      if (response.ok) {
        const userData = await response.json()
        login(userData)
        setShowLogin(false)
        setLoginForm({ email: '', password: '' })
      } else {
        alert('Credenciales inválidas')
      }
    } catch (error) {
      console.error('Error logging in:', error)
      alert('Error al iniciar sesión')
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerForm),
      })

      if (response.ok) {
        const userData = await response.json()
        login(userData)
        setShowRegister(false)
        setRegisterForm({ name: '', email: '', password: '', phone: '', address: '' })
      } else {
        const error = await response.json()
        alert(error.error || 'Error al registrarse')
      }
    } catch (error) {
      console.error('Error registering:', error)
      alert('Error al registrarse')
    }
  }

  const redeemReward = async (reward: LoyaltyReward) => {
    if (!customer || customer.loyaltyPoints < reward.pointsRequired) {
      alert('No tienes suficientes puntos')
      return
    }

    try {
      const response = await fetch('/api/loyalty/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: customer.id,
          rewardId: reward.id
        }),
      })

      if (response.ok) {
        alert(`¡Has canjeado "${reward.name}" exitosamente!`)
        fetchCustomerData()
      } else {
        const error = await response.json()
        alert(error.error || 'Error al canjear recompensa')
      }
    } catch (error) {
      console.error('Error redeeming reward:', error)
      alert('Error al canjear recompensa')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen eureka-theme">
        {/* Header */}
        <header className="eureka-header">
          <div className="eureka-container px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between eureka-spacing">
              <div className="flex items-center gap-3">
                <Link href="/" className="flex items-center gap-2">
                  <Logo size="md" variant="dark-theme" />
                  <span className="text-xl font-bold text-white">Eureka!</span>
                </Link>
              </div>
              <Link href="/catalogo">
                <Button variant="outline" className="eureka-btn-outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Ver Catálogo
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <div className="eureka-container-medium px-4 eureka-spacing-large">
          <div className="text-center mb-12">
            <Logo size="xl" variant="dark-theme" className="mx-auto mb-4" />
            <h1 className="eureka-title-large mb-4">Club de Fidelización</h1>
            <p className="eureka-text-secondary mb-8">
              Únete a nuestro club y disfruta de beneficios exclusivos
            </p>
          </div>

          <Card className="max-w-md mx-auto eureka-card">
            <CardHeader>
              <CardTitle className="text-center eureka-title">Acceso al Club</CardTitle>
              <CardDescription className="text-center eureka-text-secondary">
                Inicia sesión o regístrate para acceder a tu cuenta de fidelización
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Dialog open={showLogin} onOpenChange={setShowLogin}>
                <DialogTrigger asChild>
                  <Button className="w-full eureka-btn-primary">
                    Iniciar Sesión
                  </Button>
                </DialogTrigger>
                <DialogContent className="eureka-dialog">
                  <DialogHeader>
                    <DialogTitle className="eureka-title">Iniciar Sesión</DialogTitle>
                    <DialogDescription className="eureka-text-secondary">
                      Ingresa tus credenciales para acceder a tu cuenta
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="email" className="eureka-label">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        placeholder="tu@email.com"
                        required
                        className="eureka-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password" className="eureka-label">Contraseña</Label>
                      <Input
                        id="password"
                        type="password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        placeholder="••••••••"
                        required
                        className="eureka-input"
                      />
                    </div>
                    <Button type="submit" className="w-full eureka-btn-primary">
                      Iniciar Sesión
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={showRegister} onOpenChange={setShowRegister}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full eureka-btn-outline">
                    Registrarse
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md eureka-dialog">
                  <DialogHeader>
                    <DialogTitle className="eureka-title">Crear Cuenta</DialogTitle>
                    <DialogDescription className="eureka-text-secondary">
                      Regístrate para unirte a nuestro club de fidelización
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="eureka-label">Nombre completo</Label>
                      <Input
                        id="name"
                        value={registerForm.name}
                        onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                        placeholder="Tu nombre completo"
                        required
                        className="eureka-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="eureka-label">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        placeholder="tu@email.com"
                        required
                        className="eureka-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password" className="eureka-label">Contraseña</Label>
                      <Input
                        id="password"
                        type="password"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        placeholder="••••••••"
                        required
                        className="eureka-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="name" className="eureka-label">Teléfono</Label>
                      <Input
                        id="phone"
                        value={registerForm.phone}
                        onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                        placeholder="Tu número de teléfono"
                        className="eureka-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="address" className="eureka-label">Dirección</Label>
                      <Input
                        id="address"
                        value={registerForm.address}
                        onChange={(e) => setRegisterForm({ ...registerForm, address: e.target.value })}
                        placeholder="Tu dirección"
                        className="eureka-input"
                      />
                    </div>
                    <Button type="submit" className="w-full eureka-btn-primary">
                      Registrarse
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <div className="mt-12 eureka-grid">
            <Card className="eureka-card">
              <CardHeader>
                <Star className="eureka-icon-large mx-auto mb-2" />
                <CardTitle className="text-lg text-center eureka-title">Acumula Puntos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm eureka-text-secondary text-center">1 punto por cada dólar gastado</p>
              </CardContent>
            </Card>
            <Card className="eureka-card">
              <CardHeader>
                <Gift className="eureka-icon-large mx-auto mb-2" />
                <CardTitle className="text-lg text-center eureka-title">Canjea Premios</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm eureka-text-secondary text-center">Bebidas gratis y descuentos exclusivos</p>
              </CardContent>
            </Card>
            <Card className="eureka-card">
              <CardHeader>
                <Trophy className="eureka-icon-large mx-auto mb-2" />
                <CardTitle className="text-lg text-center eureka-title">Beneficios VIP</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm eureka-text-secondary text-center">Acceso anticipado a nuevos productos</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Logo size="xl" variant="dark-theme" className="mx-auto mb-4 animate-pulse" />
          <p className="text-white">Cargando información de fidelización...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen eureka-theme">
      {/* Header */}
      <header className="eureka-header">
        <div className="eureka-container px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between eureka-spacing">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2">
                <Logo size="md" variant="dark-theme" />
                <span className="text-xl font-bold eureka-title">Eureka!</span>
              </Link>
            </div>
            <Link href="/catalogo">
              <Button variant="outline" className="eureka-btn-outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Ver Catálogo
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="eureka-container px-4 py-8">
        {/* Customer Info */}
        <Card className="mb-8 eureka-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 eureka-title">
              <User className="eureka-icon-medium" />
              Mi Perfil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm eureka-text-secondary">Nombre</p>
                <p className="font-semibold eureka-text">{customer?.user.name || 'No especificado'}</p>
              </div>
              <div>
                <p className="text-sm eureka-text-secondary">Email</p>
                <p className="font-semibold eureka-text">{customer?.user.email}</p>
              </div>
              <div>
                <p className="text-sm eureka-text-secondary">Teléfono</p>
                <p className="font-semibold eureka-text">{customer?.phone || 'No especificado'}</p>
              </div>
              <div>
                <p className="text-sm eureka-text-secondary">Dirección</p>
                <p className="font-semibold eureka-text">{customer?.address || 'No especificada'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loyalty Points */}
        <Card className="mb-8 eureka-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 eureka-title">
              <Star className="eureka-icon-medium" />
              Mis Puntos de Fidelización
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold eureka-icon mb-2">
                {customer?.loyaltyPoints || 0}
              </div>
              <p className="eureka-text-secondary">Puntos acumulados</p>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="rewards" className="w-full">
          <TabsList className="grid w-full grid-cols-2 eureka-tabs">
            <TabsTrigger value="rewards" className="eureka-tab">Recompensas Disponibles</TabsTrigger>
            <TabsTrigger value="orders" className="eureka-tab">Historial de Pedidos</TabsTrigger>
          </TabsList>

          <TabsContent value="rewards" className="mt-8">
            <div className="eureka-grid-cards">
              {rewards.map((reward) => (
                <Card key={reward.id} className="hover:shadow-lg transition-shadow eureka-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 eureka-title">
                      <Gift className="eureka-icon-medium" />
                      {reward.name}
                    </CardTitle>
                    <CardDescription className="eureka-text-secondary">{reward.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-4">
                      <Badge variant="secondary" className="eureka-badge">
                        {reward.pointsRequired} puntos
                      </Badge>
                      {customer && customer.loyaltyPoints >= reward.pointsRequired ? (
                        <Badge className="eureka-badge-success">Disponible</Badge>
                      ) : (
                        <Badge variant="destructive">Insuficientes</Badge>
                      )}
                    </div>
                    <Button
                      onClick={() => redeemReward(reward)}
                      className="w-full eureka-btn-primary"
                      disabled={!customer || customer.loyaltyPoints < reward.pointsRequired}
                    >
                      Canjear Recompensa
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="orders" className="mt-8">
            {orders.length === 0 ? (
              <Card className="eureka-card">
                <CardContent className="text-center py-12">
                  <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold eureka-title mb-2">No tienes pedidos</h3>
                  <p className="eureka-text-secondary mb-4">Realiza tu primer pedido para empezar a acumular puntos</p>
                  <Link href="/catalogo">
                    <Button className="eureka-btn-primary">
                      Ver Catálogo
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id} className="eureka-card">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold eureka-text">Pedido #{order.id.slice(-8)}</h3>
                          <p className="text-sm eureka-text-secondary">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={order.status === 'COMPLETED' ? 'default' : 'secondary'} className="eureka-badge">
                          {order.status === 'COMPLETED' ? 'Completado' : order.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm eureka-text-secondary">Total</p>
                          <p className="font-semibold eureka-icon">${order.totalAmount.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm eureka-text-secondary">Puntos ganados</p>
                          <p className="font-semibold text-green-400">+{order.loyaltyPointsEarned}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}