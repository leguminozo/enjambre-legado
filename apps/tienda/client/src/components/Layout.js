import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, 
  Package, 
  ShoppingCart, 
  Users, 
  Tag, 
  BarChart3, 
  Settings, 
  Menu, 
  X, 
  Search, 
  Bell, 
  User,
  Store,
  Smartphone,
  Mail,
  Gift,
  TrendingUp
} from 'lucide-react';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Inicio', href: '/', icon: Home },
    { name: 'Pedidos', href: '/orders', icon: ShoppingCart },
    { name: 'Productos', href: '/products', icon: Package },
    { name: 'Clientes', href: '/customers', icon: Users },
    { name: 'Marketing', href: '#', icon: TrendingUp },
    { name: 'Descuentos', href: '#', icon: Gift },
    { name: 'Contenido', href: '#', icon: Tag },
    { name: 'Markets', href: '#', icon: Store },
    { name: 'Informes y estadísticas', href: '#', icon: BarChart3 },
    { name: 'Canales de ventas', href: '#', icon: Store, children: [
      { name: 'Tienda online', href: '#', icon: Store },
      { name: 'Point of Sale', href: '#', icon: Smartphone }
    ]},
    { name: 'Facebook & Instagram', href: '#', icon: TrendingUp },
    { name: 'Apps', href: '#', icon: Package, children: [
      { name: 'Email', href: '#', icon: Mail }
    ]},
    { name: 'Loloyal', href: '#', icon: Gift },
    { name: 'Configuración', href: '#', icon: Settings }
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (href) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar móvil */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-gray-800">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">V</span>
                </div>
              </div>
              <span className="ml-2 text-white font-semibold text-lg">Verano '25</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-300 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => (
              <NavigationItem key={item.name} item={item} isActive={isActive} />
            ))}
          </nav>
        </div>
      </div>

      {/* Sidebar desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-gray-800 pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">V</span>
            </div>
            <span className="ml-2 text-white font-semibold text-lg">Verano '25</span>
          </div>
          <nav className="mt-8 flex-1 space-y-1 px-2">
            {navigation.map((item) => (
              <NavigationItem key={item.name} item={item} isActive={isActive} />
            ))}
          </nav>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="lg:pl-64">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>

            {/* Barra de búsqueda */}
            <div className="flex-1 max-w-lg mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                  ⌘K
                </span>
              </div>
            </div>

            {/* Acciones del usuario */}
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg">
                <Bell className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {user?.name?.charAt(0) || 'A'}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {user?.name || 'Administrador'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>

        {/* Contenido de la página */}
        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

const NavigationItem = ({ item, isActive }) => {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={`w-full sidebar-item ${isActive(item.href) ? 'active' : ''}`}
        >
          <item.icon className="mr-3 h-5 w-5" />
          {item.name}
          <svg
            className={`ml-auto h-4 w-4 transform transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expanded && (
          <div className="ml-4 mt-1 space-y-1">
            {item.children.map((child) => (
              <a
                key={child.name}
                href={child.href}
                className="sidebar-item"
              >
                <child.icon className="mr-3 h-4 w-4" />
                {child.name}
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <a
      href={item.href}
      className={`sidebar-item ${isActive(item.href) ? 'active' : ''}`}
    >
      <item.icon className="mr-3 h-5 w-5" />
      {item.name}
    </a>
  );
};

export default Layout;
