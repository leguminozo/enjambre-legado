'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  Bell,
  Cable,
  Gift,
  FileText,
  Home,
  LogOut,
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
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Pedidos', href: '/orders', icon: ShoppingCart },
  { name: 'Productos', href: '/products', icon: Package },
  { name: 'Clientes', href: '/customers', icon: Users },
  { name: 'Colecciones', href: '/collections', icon: Tag },
  { name: 'Integraciones', href: '/integrations', icon: Cable },
  { name: 'Contenido CMS', href: '/content', icon: FileText },
  { name: 'Configuración', href: '/settings', icon: Settings },
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
      return;
    }

    const authorizedRoles = ['tienda_admin', 'gerente'];
    if (user && !authorizedRoles.includes(user.role)) {
      console.warn(`Access denied for role: ${user.role}`);
      router.replace('/');
    }
  }, [loading, isAuthenticated, user, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href === '#' || href === '') return false;
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  if (loading || !isAuthenticated || (user && !['tienda_admin', 'gerente'].includes(user.role))) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-accent/30">
      {/* Mobile Sidebar */}
      <div className={`fixed inset-0 z-[60] lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <button
          type="button"
          className="fixed inset-0 bg-background/80 backdrop-blur-sm"
          aria-label="Cerrar menú"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 flex w-72 flex-col bg-card border-r border-border">
          <div className="flex h-20 items-center justify-between px-6 border-b border-border">
            <Brand />
            <button type="button" onClick={() => setSidebarOpen(false)} className="text-muted-foreground hover:text-accent transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-4 py-8 overflow-y-auto custom-scrollbar">
            {navigation.map((item) => (
              <NavigationItem key={item.name} item={item} isActive={isActive} onNavigate={() => setSidebarOpen(false)} />
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-grow bg-surface-raised pt-8 pb-4 overflow-y-auto border-r border-border shadow-2xl">
          <div className="flex items-center flex-shrink-0 px-8 mb-12">
            <Brand />
          </div>
          <nav className="flex-1 space-y-1 px-4">
            {navigation.map((item) => (
              <NavigationItem key={item.name} item={item} isActive={isActive} />
            ))}
          </nav>

          <div className="px-6 py-6 border-t border-border">
            <div className="p-4 rounded-xl bg-accent/5 border border-accent/10">
              <p className="text-[0.6rem] uppercase tracking-[0.2em] text-accent mb-1">Ecosistema</p>
              <p className="text-[0.65rem] text-muted-foreground leading-relaxed">
                Operación Biocultural <br/>Vanguardia Activa
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border h-20">
          <div className="flex items-center justify-between px-6 lg:px-10 h-full">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-muted-foreground hover:text-accent transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex-1 max-w-xl mx-8 hidden sm:block">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                <input
                  type="search"
                  placeholder="Explorar legado..."
                  className="w-full pl-12 pr-12 py-3 bg-secondary border border-border rounded-full text-sm text-foreground focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all placeholder:text-muted-foreground"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[0.6rem] tracking-widest text-muted-foreground font-medium">&#8984;K</span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <button type="button" className="p-2 text-muted-foreground hover:text-accent transition-all relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-accent rounded-full shadow-glow" />
              </button>

              <div className="flex items-center gap-4 pl-6 border-l border-border">
                <div className="flex flex-col items-end hidden md:flex">
                  <span className="text-[0.7rem] font-medium text-foreground tracking-wide">
                    {user?.name || 'Administrador'}
                  </span>
                  <span className="text-[0.6rem] text-accent uppercase tracking-[0.2em] font-semibold">
                    {user?.role === 'gerente' ? 'Gerencia Real' : 'Admin Tienda'}
                  </span>
                </div>
                <div className="h-10 w-10 bg-gradient-to-br from-accent to-accent/60 rounded-full p-[1px]">
                  <div className="w-full h-full bg-card rounded-full flex items-center justify-center">
                    <span className="text-accent font-display font-bold text-sm">{user?.name?.charAt(0).toUpperCase() || 'A'}</span>
                  </div>
                </div>
              </div>

              <button type="button" onClick={handleLogout} className="p-2 text-muted-foreground hover:text-destructive transition-colors" title="Cerrar sesión">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="py-12">
          <div className="px-6 lg:px-12 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-4 group cursor-pointer">
      <div className="h-10 w-10 bg-accent rounded-xl flex items-center justify-center shrink-0 shadow-glow group-hover:scale-105 transition-transform duration-500">
        <span className="text-accent-foreground font-display font-bold text-xl">E</span>
      </div>
      <div className="flex flex-col">
        <span className="text-foreground font-display text-lg tracking-tight leading-none">Enjambre</span>
        <span className="text-accent text-[0.6rem] uppercase tracking-[0.3em] font-bold mt-1">Legado</span>
      </div>
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
          className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors text-muted-foreground hover:bg-secondary hover:text-foreground ${
            isActive(item.href) ? 'bg-secondary text-foreground' : ''
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
          <div className="ml-2 mt-1 space-y-0.5 border-l border-border pl-2">
            {item.children.map((child) => (
              <span
                key={child.name}
                className="flex items-center px-3 py-1.5 text-xs text-muted-foreground cursor-default"
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
      <span className="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-muted-foreground cursor-default">
        <item.icon className="mr-3 h-5 w-5 shrink-0 opacity-60" />
        {item.name}
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      prefetch={false}
      className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
        isActive(item.href)
          ? 'bg-accent/10 text-accent border border-accent/20'
          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
      }`}
    >
      <item.icon className="mr-3 h-5 w-5 shrink-0" />
      {item.name}
    </Link>
  );
}
