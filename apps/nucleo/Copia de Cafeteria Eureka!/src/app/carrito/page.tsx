'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useCartStore } from '@/lib/cart-store'
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Coffee, 
  ArrowLeft,
  CreditCard,
  MapPin,
  Phone,
  User
} from "lucide-react"

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

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, getTotalItems, getTotalPrice } = useCartStore()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [showCheckout, setShowCheckout] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deliveryInfo, setDeliveryInfo] = useState({
    name: '',
    phone: '',
    address: '',
    notes: ''
  })

  useEffect(() => {
    // Check if customer is logged in
    const savedCustomer = localStorage.getItem('customer')
    if (savedCustomer) {
      const customerData = JSON.parse(savedCustomer)
      setCustomer(customerData)
      setDeliveryInfo({
        name: customerData.user.name || '',
        phone: customerData.phone || '',
        address: customerData.address || '',
        notes: ''
      })
    }
  }, [])

  const handleCheckout = async () => {
    if (!customer) {
      alert('Por favor inicia sesión para continuar')
      return
    }

    if (items.length === 0) {
      alert('El carrito está vacío')
      return
    }

    if (!deliveryInfo.name || !deliveryInfo.phone || !deliveryInfo.address) {
      alert('Por favor completa todos los campos de entrega')
      return
    }

    setLoading(true)

    try {
      const orderData = {
        customerId: customer.id,
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount: getTotalPrice()
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      if (response.ok) {
        const order = await response.json()
        clearCart()
        setShowCheckout(false)
        alert(`¡Pedido creado exitosamente! ID: ${order.id.slice(-8)}`)
        
        // Update customer data in localStorage
        const updatedCustomer = { ...customer, loyaltyPoints: customer.loyaltyPoints + order.loyaltyPointsEarned }
        localStorage.setItem('customer', JSON.stringify(updatedCustomer))
        setCustomer(updatedCustomer)
      } else {
        const error = await response.json()
        alert(error.error || 'Error al crear el pedido')
      }
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Error al crear el pedido')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center">
            <ShoppingCart className="w-24 h-24 text-gray-400 mx-auto mb-8" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Tu Carrito está Vacío</h1>
            <p className="text-gray-600 mb-8">
              ¡Aún no has añadido ningún producto a tu carrito!
            </p>
            <Link href="/catalogo">
              <Button size="lg" className="bg-amber-600 hover:bg-amber-700">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Ver Catálogo
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-8 h-8 text-amber-600" />
              <h1 className="text-2xl font-bold text-gray-900">Mi Carrito</h1>
              <Badge variant="secondary">
                {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'}
              </Badge>
            </div>
            <Link href="/catalogo">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Seguir Comprando
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Productos en tu Carrito</CardTitle>
                <CardDescription>
                  Revisa los productos que has seleccionado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="w-16 h-16 bg-gradient-to-br from-amber-200 to-amber-400 rounded-lg"></div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-gray-600">${item.price.toFixed(2)} c/u</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-amber-600">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Resumen del Pedido</CardTitle>
                <CardDescription>
                  Total de tu compra
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${getTotalPrice().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Envío</span>
                    <span className="text-green-600">Gratis</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-amber-600">${getTotalPrice().toFixed(2)}</span>
                  </div>
                  
                  {customer && (
                    <div className="bg-amber-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Coffee className="w-4 h-4 text-amber-600" />
                        <span className="font-medium text-sm">Puntos a ganar</span>
                      </div>
                      <p className="text-amber-600 font-semibold">
                        +{Math.floor(getTotalPrice())} puntos
                      </p>
                    </div>
                  )}

                  <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full bg-amber-600 hover:bg-amber-700"
                        disabled={!customer}
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        {customer ? 'Proceder al Pago' : 'Inicia Sesión para Comprar'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Información de Entrega</DialogTitle>
                        <DialogDescription>
                          Confirma tus datos para completar el pedido
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="name">Nombre completo</Label>
                          <Input
                            id="name"
                            value={deliveryInfo.name}
                            onChange={(e) => setDeliveryInfo({ ...deliveryInfo, name: e.target.value })}
                            placeholder="Tu nombre completo"
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Teléfono</Label>
                          <Input
                            id="phone"
                            value={deliveryInfo.phone}
                            onChange={(e) => setDeliveryInfo({ ...deliveryInfo, phone: e.target.value })}
                            placeholder="Tu número de teléfono"
                          />
                        </div>
                        <div>
                          <Label htmlFor="address">Dirección de entrega</Label>
                          <Input
                            id="address"
                            value={deliveryInfo.address}
                            onChange={(e) => setDeliveryInfo({ ...deliveryInfo, address: e.target.value })}
                            placeholder="Dirección completa"
                          />
                        </div>
                        <div>
                          <Label htmlFor="notes">Notas (opcional)</Label>
                          <Input
                            id="notes"
                            value={deliveryInfo.notes}
                            onChange={(e) => setDeliveryInfo({ ...deliveryInfo, notes: e.target.value })}
                            placeholder="Instrucciones especiales"
                          />
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium mb-2">Resumen del Pedido</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>{getTotalItems()} artículos</span>
                              <span>${getTotalPrice().toFixed(2)}</span>
                            </div>
                            {customer && (
                              <div className="flex justify-between text-amber-600">
                                <span>Puntos a ganar</span>
                                <span>+{Math.floor(getTotalPrice())}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <Button 
                          onClick={handleCheckout} 
                          className="w-full"
                          disabled={loading}
                        >
                          {loading ? 'Procesando...' : 'Confirmar Pedido'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {!customer && (
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">
                        ¿Ya tienes cuenta?
                      </p>
                      <Link href="/fidelizacion">
                        <Button variant="outline" size="sm" className="w-full">
                          <User className="w-4 h-4 mr-2" />
                          Iniciar Sesión
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}