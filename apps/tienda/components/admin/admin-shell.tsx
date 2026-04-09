'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  Bell,
  Cable,
  Gift,
  Home,
  Mail,
  Menu,
  Package,
  Search,
  Settings,
  ShoppingCart,
  Smartphone,
  Store,
  Tag,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/auth-context';

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: { name: string; href: string; icon: React.ComponentType<{ className?: string }> }[];
};

const navigation: NavItem[] = [
  { name: 'Inicio', href: '/dashboard', icon: Home },
  { name: 'Pedidos', href: '/orders', icon: ShoppingCart },
  { name: 'Productos', href: '/products', icon: Package },
  { name: 'Clientes', href: '/customers', icon: Users },
  { name: 'Colecciones', href: '/collections', icon: Tag },
  { name: 'Integraciones', href: '/integrations', icon: Cable },
  { name: 'Marketing', href: '#', icon: TrendingUp },
  { name: 'Descuentos', href: '#', icon: Gift },
  { name: 'Contenido', href: '#', icon: Tag },
  { name: 'Markets', href: '#', icon: Store },
  { name: 'Informes y estadísticas', href: '#', icon: BarChart3 },
  {
    name: 'Canales de ventas',
    href: '#',
    icon: Store,
    children: [
      { name: 'Tienda online', href: '#', icon: Store },
      { name: 'Point of Sale', href: '#', icon: Smartphone },
    ],
  },
  { name: 'Facebook & Instagram', href: '#', icon: TrendingUp },
  {
    name: 'Apps',
    href: '#',
    icon: Package,
    children: [{ name: 'Email', href: '#', icon: Mail }],
  },
  { name: 'Loloyal', href: '#', icon: Gift },
  { name: 'Configuración', href: '#', icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, isAuthenticated, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [loading, isAuthenticated, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href === '#' || href === '') return false;
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <button
          type="button"
          className="fixed inset-0 bg-gray-600/75"
          aria-label="Cerrar menú"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-gray-900">
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-800">
            <Brand />
            <button type="button" onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-white">
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
            {navigation.map((item) => (
              <NavigationItem key={item.name} item={item} isActive={isActive} onNavigate={() => setSidebarOpen(false)} />
            ))}
          </nav>
        </div>
      </div>

      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-gray-900 pt-5 pb-4 overflow-y-auto border-r border-gray-800">
          <div className="flex items-center flex-shrink-0 px-4">
            <Brand />
          </div>
          <nav className="mt-8 flex-1 space-y-1 px-2">
            {navigation.map((item) => (
              <NavigationItem key={item.name} item={item} isActive={isActive} />
            ))}
          </nav>
        </div>
      </div>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex-1 max-w-lg mx-4 hidden sm:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="search"
                  placeholder="Buscar..."
                  className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">⌘K</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button type="button" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <Bell className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">{user?.name?.charAt(0).toUpperCase() || 'A'}</span>
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[120px] truncate">
                  {user?.name || 'Administrador'}
                </span>
              </div>
              <button type="button" onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-800">
                Cerrar sesión
              </button>
            </div>
          </div>
        </header>

        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center shrink-0">
        <span className="text-white font-bold text-sm">E</span>
      </div>
      <span className="text-white font-semibold text-sm leading-tight">Enjambre Legado</span>
    </div>
  );
}

function NavigationItem({
  item,
  isActive,
  onNavigate,
}: {
  item: NavItem;
  isActive: (href: string) => boolean;
  onNavigate?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  if (hasChildren) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors text-gray-300 hover:bg-gray-800 hover:text-white ${
            isActive(item.href) ? 'bg-gray-800 text-white' : ''
          }`}
        >
          <item.icon className="mr-3 h-5 w-5 shrink-0" />
          <span className="text-left flex-1">{item.name}</span>
          <svg
            className={`h-4 w-4 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expanded && item.children && (
          <div className="ml-2 mt-1 space-y-0.5 border-l border-gray-700 pl-2">
            {item.children.map((child) => (
              <span
                key={child.name}
                className="flex items-center px-3 py-1.5 text-xs text-gray-500 cursor-default"
              >
                <child.icon className="mr-2 h-4 w-4" />
                {child.name}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (item.href === '#') {
    return (
      <span className="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-500 cursor-default">
        <item.icon className="mr-3 h-5 w-5 shrink-0 opacity-60" />
        {item.name}
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
        isActive(item.href)
          ? 'bg-primary-600/20 text-primary-300 border border-primary-600/40'
          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
      }`}
    >
      <item.icon className="mr-3 h-5 w-5 shrink-0" />
      {item.name}
    </Link>
  );
}
