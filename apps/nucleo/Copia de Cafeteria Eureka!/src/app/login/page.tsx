'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthStore } from '@/lib/auth-store'
import { ArrowLeft, Eye, EyeOff } from "lucide-react"
import { Logo } from "@/components/ui/logo"

export default function LoginPage() {
  const { login } = useAuthStore()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const userData = await response.json()
        login(userData)
        
        // Fetch customer data and store it
        const customerResponse = await fetch(`/api/customers?userId=${userData.id}`)
        if (customerResponse.ok) {
          const customerData = await customerResponse.json()
          localStorage.setItem('customer', JSON.stringify(customerData))
        }
        
        // Redirect based on user role
        if (userData.role === 'ADMIN') {
          window.location.href = '/admin'
        } else {
          window.location.href = '/fidelizacion'
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Credenciales inválidas')
      }
    } catch (error) {
      console.error('Error logging in:', error)
      setError('Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-3">
            <Logo size="xl" variant="default" />
          </Link>
        </div>

        <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-white font-light">Iniciar Sesión</CardTitle>
            <CardDescription className="text-gray-300">
              Ingresa tus credenciales para acceder a tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              <div>
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="tu@email.com"
                  required
                  className="mt-2 bg-black/40 border-white/20 text-white placeholder-gray-400 focus:border-amber-400 focus:ring-amber-400/20"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-white">Contraseña</Label>
                <div className="relative mt-2">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    required
                    className="pr-10 bg-black/40 border-white/20 text-white placeholder-gray-400 focus:border-amber-400 focus:ring-amber-400/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-amber-400 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="outline"
                className="w-full !bg-gradient-to-r !from-amber-500 !to-amber-600 !text-white font-semibold hover:!from-amber-600 hover:!to-amber-700 py-3 text-lg font-medium rounded-full transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl !border-0"
                style={{
                  background: 'linear-gradient(to right, #f59e0b, #d97706)',
                  color: 'white',
                  border: 'none'
                }}
                disabled={loading}
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-300">
                ¿No tienes cuenta?{' '}
                <Link href="/register" className="text-amber-400 hover:text-amber-300 transition-colors">
                  Regístrate aquí
                </Link>
              </p>
            </div>

            <div className="mt-6">
              <Link href="/">
                <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 hover:border-white/40 rounded-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al Inicio
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Demo credentials */}
        <Card className="mt-8 bg-black/40 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm text-amber-400">Credenciales de Demo</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="space-y-3">
              <div>
                <p className="font-medium text-white">Cliente:</p>
                <p className="text-gray-300">Email: customer@example.com</p>
                <p className="text-gray-300">Contraseña: password123</p>
              </div>
              <div>
                <p className="font-medium text-white">Administrador:</p>
                <p className="text-gray-300">Email: admin@example.com</p>
                <p className="text-gray-300">Contraseña: admin123</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}