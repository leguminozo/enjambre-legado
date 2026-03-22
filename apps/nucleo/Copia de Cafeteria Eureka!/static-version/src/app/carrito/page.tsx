"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Plus, Minus, Trash2, ArrowLeft, CreditCard, MapPin, Clock } from 'lucide-react';

export default function CarritoPage() {
  const [cart, setCart] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Cargar carrito del localStorage
    const savedCart = localStorage.getItem('eureka-cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }

    // Verificar si el usuario está logueado
    const userData = localStorage.getItem('eureka-user');
    if (userData) {
      setUser(JSON.parse(userData));
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    // Guardar carrito en localStorage
    localStorage.setItem('eureka-cart', JSON.stringify(cart));
  }, [cart]);

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item => 
        item.id === productId 
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  const handleCheckout = () => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    setShowCheckout(true);
  };

  const handleOrderComplete = () => {
    // Simular orden completada
    alert('¡Orden completada con éxito! Gracias por tu compra.');
    
    // Limpiar carrito
    setCart([]);
    localStorage.removeItem('eureka-cart');
    
    // Redirigir a home
    router.push('/');
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen eureka-theme flex items-center justify-center px-4">
        <div className="text-center">
          <ShoppingCart className="w-24 h-24 text-gray-400 mx-auto mb-6" />
          <h1 className="text-3xl font-light text-white mb-4">Tu carrito está vacío</h1>
          <p className="text-eureka-text-secondary mb-8 text-lg">
            Parece que aún no has agregado productos a tu carrito
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/catalogo" className="eureka-btn-white px-8 py-3 text-lg font-medium">
              Ver Menú
            </Link>
            <Link href="/" className="eureka-btn-outline px-8 py-3 text-lg font-medium">
              Volver al Inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen eureka-theme">
      {/* Header */}
      <header className="eureka-header">
        <div className="eureka-container px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center eureka-spacing">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 rounded-full bg-white shadow-2xl border-2 border-amber-300/50"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <img 
                    alt="Eureka Cafe" 
                    src="/eureka-logo-new.png" 
                    className="w-full h-full object-contain p-1 filter brightness-0"
                  />
                </div>
              </div>
              <span className="font-light tracking-wide text-xl text-white">Eureka!</span>
            </Link>
            
            <div className="flex items-center gap-4">
              <Link href="/catalogo" className="eureka-btn-outline border-0">
                Continuar Comprando
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-8">
        <div className="eureka-container max-w-6xl">
          {/* Título */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/catalogo" className="eureka-btn-outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Menú
            </Link>
            <h1 className="text-3xl font-light text-white">Tu Carrito</h1>
            <span className="bg-amber-400 text-white px-3 py-1 rounded-full text-sm font-medium">
              {cartItemCount} {cartItemCount === 1 ? 'producto' : 'productos'}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Lista de productos */}
            <div className="lg:col-span-2">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h2 className="text-xl font-semibold text-white mb-6">Productos en tu carrito</h2>
                
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      
                      <div className="flex-1">
                        <h3 className="text-white font-medium text-lg">{item.name}</h3>
                        <p className="text-eureka-text-secondary text-sm mb-2">{item.description}</p>
                        <div className="text-amber-400 font-bold text-lg">
                          ${item.price.toLocaleString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-white font-medium w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Resumen del pedido */}
            <div className="lg:col-span-1">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 sticky top-8">
                <h2 className="text-xl font-semibold text-white mb-6">Resumen del Pedido</h2>
                
                {/* Detalles del pedido */}
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-eureka-text-secondary">
                    <span>Subtotal ({cartItemCount} {cartItemCount === 1 ? 'producto' : 'productos'})</span>
                    <span>${cartTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-eureka-text-secondary">
                    <span>Envío</span>
                    <span className="text-green-400">Gratis</span>
                  </div>
                  <div className="border-t border-white/20 pt-4">
                    <div className="flex justify-between text-xl font-bold text-white">
                      <span>Total</span>
                      <span>${cartTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Botón de checkout */}
                <button
                  onClick={handleCheckout}
                  className="w-full eureka-btn-white py-4 text-lg font-medium rounded-lg mb-4"
                >
                  <CreditCard className="w-5 h-5 inline mr-2" />
                  {isLoggedIn ? 'Finalizar Compra' : 'Iniciar Sesión para Comprar'}
                </button>

                {/* Información adicional */}
                <div className="text-center text-sm text-eureka-text-secondary">
                  <p>• Envío gratis en Castro</p>
                  <p>• Entrega en 30-45 minutos</p>
                  <p>• Pago seguro online</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Checkout */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-eureka-theme rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-light text-white mb-2">Finalizar Pedido</h2>
              <p className="text-eureka-text-secondary">Completa tu información de entrega</p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Dirección de entrega</label>
                <div className="flex items-center gap-2 p-3 bg-white/20 rounded-lg">
                  <MapPin className="w-5 h-5 text-amber-400" />
                  <span className="text-white">
                    {user?.address || 'Blanco Encalada 128, Castro, Chiloé'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Horario de entrega</label>
                <div className="flex items-center gap-2 p-3 bg-white/20 rounded-lg">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <span className="text-white">30-45 minutos</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Total a pagar</label>
                <div className="text-2xl font-bold text-amber-400 text-center">
                  ${cartTotal.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleOrderComplete}
                className="w-full eureka-btn-white py-3 rounded-lg"
              >
                Confirmar Pedido
              </button>
              <button
                onClick={() => setShowCheckout(false)}
                className="w-full eureka-btn-outline py-3 rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
