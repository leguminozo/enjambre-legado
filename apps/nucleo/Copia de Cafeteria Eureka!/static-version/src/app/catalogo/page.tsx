"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, Star, Coffee, Cake, GlassWater, Plus, Minus } from 'lucide-react';

// Productos estáticos
const products = [
  {
    id: 1,
    name: "Café Americano",
    description: "Café negro suave y aromático",
    price: 2500,
    category: "cafe",
    image: "/eureka-logo-new.png",
    featured: true,
    available: true
  },
  {
    id: 2,
    name: "Cappuccino Clásico",
    description: "Espresso con leche espumada y cacao",
    price: 3200,
    category: "cafe",
    image: "/eureka-logo-new.png",
    featured: true,
    available: true
  },
  {
    id: 3,
    name: "Latte de Vainilla",
    description: "Espresso con leche y vainilla natural",
    price: 3500,
    category: "cafe",
    image: "/eureka-logo-new.png",
    featured: false,
    available: true
  },
  {
    id: 4,
    name: "Croissant Clásico",
    description: "Hojaldre dorado y crujiente",
    price: 1800,
    category: "reposteria",
    image: "/eureka-logo-new.png",
    featured: true,
    available: true
  },
  {
    id: 5,
    name: "Torta de Chocolate",
    description: "Chocolate belga con frutos rojos",
    price: 4200,
    category: "reposteria",
    image: "/eureka-logo-new.png",
    featured: false,
    available: true
  },
  {
    id: 6,
    name: "Jugo de Naranja Natural",
    description: "Naranjas frescas de Chiloé",
    price: 2800,
    category: "jugos",
    image: "/eureka-logo-new.png",
    featured: true,
    available: true
  },
  {
    id: 7,
    name: "Smoothie de Frutilla",
    description: "Frutillas frescas con yogurt natural",
    price: 3200,
    category: "jugos",
    image: "/eureka-logo-new.png",
    featured: false,
    available: true
  },
  {
    id: 8,
    name: "Café de Especialidad",
    description: "Granos seleccionados de Chiloé",
    price: 4500,
    category: "cafe",
    image: "/eureka-logo-new.png",
    featured: true,
    available: true
  }
];

const categories = [
  { id: "todos", name: "Todos", icon: Coffee },
  { id: "cafe", name: "Café", icon: Coffee },
  { id: "reposteria", name: "Repostería", icon: Cake },
  { id: "jugos", name: "Jugos", icon: GlassWater }
];

export default function CatalogoPage() {
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [cart, setCart] = useState<any[]>([]);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    // Cargar carrito del localStorage
    const savedCart = localStorage.getItem('eureka-cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    // Guardar carrito en localStorage
    localStorage.setItem('eureka-cart', JSON.stringify(cart));
  }, [cart]);

  const filteredProducts = selectedCategory === "todos" 
    ? products 
    : products.filter(product => product.category === selectedCategory);

  const addToCart = (product: any) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.id !== productId));
  };

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

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

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
              <Link href="/" className="eureka-btn-outline border-0">
                Inicio
              </Link>
              
              <button 
                onClick={() => setShowCart(!showCart)}
                className="eureka-btn-white relative"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-8">
        <div className="eureka-container">
          {/* Título */}
          <div className="text-center mb-12">
            <h1 className="eureka-responsive-text font-light eureka-title mb-6 tracking-wide">
              Nuestro Menú
            </h1>
            <p className="text-xl eureka-text-secondary max-w-3xl mx-auto leading-relaxed">
              Descubre la autenticidad de Chiloé en cada producto
            </p>
          </div>

          {/* Filtros de categorías */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all ${
                    selectedCategory === category.id
                      ? 'bg-amber-400 text-white shadow-lg'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {category.name}
                </button>
              );
            })}
          </div>

          {/* Grid de productos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:border-amber-400/50 transition-all group">
                {/* Imagen del producto */}
                <div className="relative mb-4">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  {product.featured && (
                    <div className="absolute top-2 right-2 bg-amber-400 text-white px-2 py-1 rounded-full text-xs font-medium">
                      <Star className="w-3 h-3 inline mr-1" />
                      Destacado
                    </div>
                  )}
                </div>

                {/* Información del producto */}
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-white mb-2">{product.name}</h3>
                  <p className="text-eureka-text-secondary text-sm mb-3">{product.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-amber-400">
                      ${product.price.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-400 capitalize">
                      {product.category}
                    </span>
                  </div>
                </div>

                {/* Botón agregar al carrito */}
                <button
                  onClick={() => addToCart(product)}
                  className="w-full eureka-btn-white py-3 rounded-lg transition-all hover:scale-105"
                >
                  Agregar al Carrito
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Carrito lateral */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div className="w-full max-w-md bg-eureka-theme h-full overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-light text-white">Tu Carrito</h2>
                <button 
                  onClick={() => setShowCart(false)}
                  className="text-white hover:text-amber-400 transition-colors"
                >
                  ✕
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-eureka-text-secondary">Tu carrito está vacío</p>
                </div>
              ) : (
                <>
                  {/* Items del carrito */}
                  <div className="space-y-4 mb-6">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-4 bg-white/10 rounded-lg">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h3 className="text-white font-medium">{item.name}</h3>
                          <p className="text-eureka-text-secondary text-sm">${item.price.toLocaleString()}</p>
                        </div>
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
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="border-t border-white/20 pt-4 mb-6">
                    <div className="flex justify-between items-center text-xl font-bold text-white">
                      <span>Total:</span>
                      <span>${cartTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="space-y-3">
                    <button className="w-full eureka-btn-white py-3 rounded-lg">
                      Finalizar Compra
                    </button>
                    <button 
                      onClick={() => setCart([])}
                      className="w-full eureka-btn-outline py-3 rounded-lg"
                    >
                      Vaciar Carrito
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
