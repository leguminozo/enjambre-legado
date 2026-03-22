"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Crown, Star, Gift, Coffee, Cake, Juice, TrendingUp, Award, Users, Zap } from 'lucide-react';

export default function FidelizacionPage() {
  const [user, setUser] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Verificar si el usuario está logueado
    const userData = localStorage.getItem('eureka-user');
    if (userData) {
      setUser(JSON.parse(userData));
      setIsLoggedIn(true);
    }
  }, []);

  const benefits = [
    {
      icon: Crown,
      title: "Puntos de Bienvenida",
      description: "100 puntos al registrarte en el Club Eureka",
      points: 100
    },
    {
      icon: Coffee,
      title: "Café Gratis",
      description: "Café americano gratis cada 500 puntos",
      points: 500
    },
    {
      icon: Cake,
      title: "Postre Gratis",
      description: "Postre de la casa cada 800 puntos",
      points: 800
    },
    {
      icon: Gift,
      title: "Descuento 20%",
      description: "20% de descuento en tu compra cada 1000 puntos",
      points: 1000
    },
    {
      icon: Star,
      title: "Experiencia VIP",
      description: "Acceso a eventos exclusivos cada 2000 puntos",
      points: 2000
    }
  ];

  const levels = [
    {
      name: "Bronce",
      minPoints: 0,
      maxPoints: 499,
      color: "text-amber-600",
      bgColor: "bg-amber-600/20",
      borderColor: "border-amber-600/50"
    },
    {
      name: "Plata",
      minPoints: 500,
      maxPoints: 999,
      color: "text-gray-400",
      bgColor: "bg-gray-400/20",
      borderColor: "border-gray-400/50"
    },
    {
      name: "Oro",
      minPoints: 1000,
      maxPoints: 1999,
      color: "text-yellow-400",
      bgColor: "bg-yellow-400/20",
      borderColor: "border-yellow-400/50"
    },
    {
      name: "Platino",
      minPoints: 2000,
      maxPoints: 9999,
      color: "text-cyan-400",
      bgColor: "bg-cyan-400/20",
      borderColor: "border-cyan-400/50"
    },
    {
      name: "Diamante",
      minPoints: 10000,
      maxPoints: 99999,
      color: "text-purple-400",
      bgColor: "bg-purple-400/20",
      borderColor: "border-purple-400/50"
    }
  ];

  const getCurrentLevel = (points: number) => {
    return levels.find(level => points >= level.minPoints && points <= level.maxPoints) || levels[0];
  };

  const getNextLevel = (points: number) => {
    const currentLevelIndex = levels.findIndex(level => points >= level.minPoints && points <= level.maxPoints);
    return levels[currentLevelIndex + 1] || null;
  };

  const currentLevel = user ? getCurrentLevel(user.loyaltyPoints) : levels[0];
  const nextLevel = user ? getNextLevel(user.loyaltyPoints) : null;
  const progressToNext = nextLevel ? ((user?.loyaltyPoints - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100 : 100;

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
              <Link href="/catalogo" className="eureka-btn-outline border-0">
                Menú
              </Link>
              {!isLoggedIn && (
                <Link href="/login" className="eureka-btn-white">
                  Unirse al Club
                </Link>
              )}
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
              Club de Fidelización Eureka
            </h1>
            <p className="text-xl eureka-text-secondary max-w-3xl mx-auto leading-relaxed">
              Únete a nuestra comunidad y disfruta de beneficios exclusivos en cada visita
            </p>
          </div>

          {/* Estado del usuario si está logueado */}
          {isLoggedIn && user && (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 mb-12">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Crown className={`w-12 h-12 ${currentLevel.color}`} />
                  <div>
                    <h2 className="text-2xl font-light text-white">¡Hola, {user.name}!</h2>
                    <p className="text-eureka-text-secondary">Nivel {currentLevel.name}</p>
                  </div>
                </div>
                
                {/* Puntos actuales */}
                <div className="bg-gradient-to-r from-amber-400 to-yellow-400 text-white px-8 py-4 rounded-full inline-block mb-6">
                  <div className="text-3xl font-bold">{user.loyaltyPoints}</div>
                  <div className="text-sm opacity-90">Puntos Acumulados</div>
                </div>

                {/* Progreso al siguiente nivel */}
                {nextLevel && (
                  <div className="max-w-md mx-auto">
                    <div className="flex justify-between text-sm text-eureka-text-secondary mb-2">
                      <span>Nivel {currentLevel.name}</span>
                      <span>Nivel {nextLevel.name}</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-3 mb-2">
                      <div 
                        className="bg-gradient-to-r from-amber-400 to-yellow-400 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${progressToNext}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-eureka-text-secondary">
                      {nextLevel.minPoints - user.loyaltyPoints} puntos más para el siguiente nivel
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Beneficios del club */}
          <div className="mb-12">
            <h2 className="text-3xl font-light text-white text-center mb-8">Beneficios del Club</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:border-amber-400/50 transition-all group">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-amber-400/20 rounded-full">
                        <Icon className="w-8 h-8 text-amber-400" />
                      </div>
                      <div className="bg-amber-400 text-white px-3 py-1 rounded-full text-sm font-medium">
                        {benefit.points} pts
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">{benefit.title}</h3>
                    <p className="text-eureka-text-secondary">{benefit.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Niveles del club */}
          <div className="mb-12">
            <h2 className="text-3xl font-light text-white text-center mb-8">Niveles del Club</h2>
            <div className="space-y-4">
              {levels.map((level, index) => (
                <div 
                  key={index}
                  className={`p-6 rounded-2xl border-2 transition-all ${
                    user && user.loyaltyPoints >= level.minPoints && user.loyaltyPoints <= level.maxPoints
                      ? `${level.bgColor} ${level.borderColor}`
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${level.bgColor}`}>
                        <span className={`text-2xl font-bold ${level.color}`}>
                          {level.name === 'Bronce' ? '🥉' : 
                           level.name === 'Plata' ? '🥈' : 
                           level.name === 'Oro' ? '🥇' : 
                           level.name === 'Platino' ? '💎' : '👑'}
                        </span>
                      </div>
                      <div>
                        <h3 className={`text-xl font-semibold ${level.color}`}>{level.name}</h3>
                        <p className="text-eureka-text-secondary">
                          {level.minPoints} - {level.maxPoints === 99999 ? '∞' : level.maxPoints} puntos
                        </p>
                      </div>
                    </div>
                    {user && user.loyaltyPoints >= level.minPoints && user.loyaltyPoints <= level.maxPoints && (
                      <div className="bg-amber-400 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Nivel Actual
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cómo ganar puntos */}
          <div className="mb-12">
            <h2 className="text-3xl font-light text-white text-center mb-8">¿Cómo Ganar Puntos?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center">
                <TrendingUp className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Por Compra</h3>
                <p className="text-eureka-text-secondary">1 punto por cada $100 gastados</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center">
                <Users className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Referidos</h3>
                <p className="text-eureka-text-secondary">50 puntos por cada amigo que se registre</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center">
                <Zap className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Visitas</h3>
                <p className="text-eureka-text-secondary">10 puntos por cada visita semanal</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            {!isLoggedIn ? (
              <div className="bg-gradient-to-r from-amber-400 to-yellow-400 rounded-2xl p-8">
                <h2 className="text-3xl font-light text-white mb-4">¿Listo para unirte?</h2>
                <p className="text-white/90 mb-6 text-lg">
                  Regístrate ahora y obtén 100 puntos de bienvenida
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/register" className="eureka-btn-white px-8 py-3 text-lg font-medium">
                    Crear Cuenta
                  </Link>
                  <Link href="/login" className="eureka-btn-outline px-8 py-3 text-lg font-medium border-white text-white hover:bg-white hover:text-amber-600">
                    Ya tengo cuenta
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-amber-400 to-yellow-400 rounded-2xl p-8">
                <h2 className="text-3xl font-light text-white mb-4">¡Gracias por ser parte del Club!</h2>
                <p className="text-white/90 mb-6 text-lg">
                  Continúa visitándonos para acumular más puntos y beneficios
                </p>
                <Link href="/catalogo" className="eureka-btn-white px-8 py-3 text-lg font-medium">
                  Ver Menú
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
