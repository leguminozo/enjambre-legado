import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Activity,
  Clock,
  Globe,
  Eye,
  BarChart3,
  Settings,
  Mail,
  Smartphone,
  Target
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/dashboard/metrics/${period}`);
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Error obteniendo datos del dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('es-CL').format(num);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No se pudieron cargar los datos del dashboard</p>
      </div>
    );
  }

  const { overview, chartData, liveVisitors, channels, period: periodText } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Header del dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Resumen general de tu tienda</p>
        </div>
        
        {/* Filtros y controles */}
        <div className="mt-4 sm:mt-0 flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="90d">Últimos 90 días</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Globe className="h-4 w-4 text-gray-400" />
            <select className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option>{channels}</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Eye className="h-4 w-4" />
            <span>{liveVisitors} visitantes en vivo</span>
          </div>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Sesiones"
          value={formatNumber(overview.sessions.current)}
          change={overview.sessions.change}
          trend={overview.sessions.trend}
          icon={Activity}
          color="blue"
        />
        <MetricCard
          title="Ventas totales"
          value={formatCurrency(overview.totalSales.current)}
          change={overview.totalSales.change}
          trend={overview.totalSales.trend}
          icon={DollarSign}
          color="green"
        />
        <MetricCard
          title="Pedidos"
          value={formatNumber(overview.orders.current)}
          change={overview.orders.change}
          trend={overview.orders.trend}
          icon={ShoppingCart}
          color="purple"
        />
        <MetricCard
          title="Tasa de conversión"
          value={`${overview.conversionRate.current}%`}
          change={overview.conversionRate.change}
          trend={overview.conversionRate.trend}
          icon={Target}
          color="orange"
        />
      </div>

      {/* Gráfico de sesiones */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Sesiones</h3>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              <span>Período actual</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full border-2 border-dashed"></div>
              <span>Período anterior</span>
            </div>
          </div>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData.sessions}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' })}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString('es-CL', { 
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric' 
                })}
                formatter={(value, name) => [value, name === 'current' ? 'Período actual' : 'Período anterior']}
              />
              <Line 
                type="monotone" 
                dataKey="current" 
                stroke="#2563eb" 
                strokeWidth={2}
                dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="previous" 
                stroke="#9ca3af" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#9ca3af', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tarjetas informativas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Guía de configuración */}
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-blue-900 mb-2">Guía de configuración</h4>
              <p className="text-blue-700 text-sm mb-3">
                11 de 17 tareas completadas
              </p>
              <p className="text-blue-600 text-sm mb-4">
                Usa esta guía personalizada para poner tu tienda en marcha.
              </p>
              <div className="bg-blue-200 rounded-lg p-3 mb-4">
                <p className="text-blue-800 text-sm font-medium">
                  Siguiente: Permite hacer descargas con una aplicación de productos digitales
                </p>
              </div>
              <button className="btn-primary bg-blue-600 hover:bg-blue-700">
                Retomar guía
              </button>
            </div>
            <div className="ml-4">
              <div className="w-16 h-16 bg-blue-200 rounded-lg flex items-center justify-center">
                <Settings className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Recuperación de carritos abandonados */}
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-green-900 mb-2">
                Recupera ventas con un correo electrónico de carrito abandonado
              </h4>
              <p className="text-green-700 text-sm mb-4">
                Se ha creado un correo electrónico automático. Revisa y ajusta su diseño, mensaje o lista de destinatarios.
              </p>
              <button className="btn-primary bg-green-600 hover:bg-green-700">
                Revisar correo electrónico
              </button>
            </div>
            <div className="ml-4">
              <div className="w-16 h-16 bg-green-200 rounded-lg flex items-center justify-center">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Medición de retorno de anuncios */}
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-purple-900 mb-2">
                Mide el retorno del gasto en anuncios
              </h4>
              <p className="text-purple-700 text-sm mb-4">
                Consigue información útil y objetiva sobre el rendimiento de tus anuncios directamente de la plataforma.
              </p>
              <div className="space-y-2">
                <button className="w-full text-left text-purple-700 hover:text-purple-800 text-sm font-medium">
                  Ver información útil del canal
                </button>
                <button className="w-full text-left text-purple-700 hover:text-purple-800 text-sm font-medium">
                  Más información
                </button>
              </div>
            </div>
            <div className="ml-4">
              <div className="w-16 h-16 bg-purple-200 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, change, trend, icon: Icon, color }) => {
  const isPositive = trend === 'increase';
  const changeColor = isPositive ? 'text-green-600' : 'text-red-600';
  const changeIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div className="metric-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="metric-label">{title}</p>
          <p className="metric-value">{value}</p>
          <div className="flex items-center space-x-1 mt-1">
            <changeIcon className={`h-4 w-4 ${changeColor}`} />
            <span className={`metric-change ${changeColor}`}>
              {Math.abs(change)}%
            </span>
          </div>
        </div>
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
