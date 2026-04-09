'use client';

import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  BarChart3,
  Clock,
  DollarSign,
  Eye,
  Globe,
  Mail,
  Settings,
  ShoppingCart,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DashboardPeriod } from '@/lib/mock-admin-data';
import { getMockDashboard } from '@/lib/mock-admin-data';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(num: number) {
  return new Intl.NumberFormat('es-CL').format(num);
}

export function DashboardView() {
  const [period, setPeriod] = useState<DashboardPeriod>('30d');
  const data = useMemo(() => getMockDashboard(period), [period]);
  const { overview, chartData, liveVisitors, channels } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Resumen general de tu tienda</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as DashboardPeriod)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="90d">Últimos 90 días</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600 max-w-[200px] truncate">{channels}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Eye className="h-4 w-4" />
            <span>{liveVisitors} visitantes en vivo</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Sesiones"
          value={formatNumber(overview.sessions.current)}
          change={overview.sessions.change}
          trend={overview.sessions.trend}
          icon={Activity}
          accent="blue"
        />
        <MetricCard
          title="Ventas totales"
          value={formatCurrency(overview.totalSales.current)}
          change={overview.totalSales.change}
          trend={overview.totalSales.trend}
          icon={DollarSign}
          accent="emerald"
        />
        <MetricCard
          title="Pedidos"
          value={formatNumber(overview.orders.current)}
          change={overview.orders.change}
          trend={overview.orders.trend}
          icon={ShoppingCart}
          accent="violet"
        />
        <MetricCard
          title="Tasa de conversión"
          value={`${overview.conversionRate.current}%`}
          change={overview.conversionRate.change}
          trend={overview.conversionRate.trend}
          icon={Target}
          accent="amber"
        />
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Sesiones</h2>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-600 rounded-full" /> Período actual
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 bg-gray-400 rounded-full border-2 border-dashed border-gray-500" /> Anterior
            </span>
          </div>
        </div>
        <div className="h-80 w-full min-h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData.sessions}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) =>
                  new Date(v).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' })
                }
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                labelFormatter={(v) =>
                  new Date(v as string).toLocaleDateString('es-CL', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })
                }
              />
              <Line type="monotone" dataKey="current" name="Actual" stroke="#2563eb" strokeWidth={2} dot={false} />
              <Line
                type="monotone"
                dataKey="previous"
                name="Anterior"
                stroke="#9ca3af"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Guía de configuración</h3>
              <p className="text-blue-700 text-sm mb-3">11 de 17 tareas completadas</p>
              <p className="text-blue-600 text-sm mb-4">
                Usa esta guía para poner la tienda en marcha (datos de demostración).
              </p>
              <button type="button" className="btn-primary bg-blue-600 hover:bg-blue-700">
                Retomar guía
              </button>
            </div>
            <div className="w-14 h-14 bg-blue-200 rounded-lg flex items-center justify-center shrink-0">
              <Settings className="h-7 w-7 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-green-900 mb-2">Carrito abandonado</h3>
              <p className="text-green-700 text-sm mb-4">
                Revisa el flujo de correos automáticos cuando conectes marketing.
              </p>
              <button type="button" className="btn-primary bg-green-600 hover:bg-green-700">
                Revisar flujo
              </button>
            </div>
            <div className="w-14 h-14 bg-green-200 rounded-lg flex items-center justify-center shrink-0">
              <Mail className="h-7 w-7 text-green-600" />
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-purple-900 mb-2">Rendimiento de anuncios</h3>
              <p className="text-purple-700 text-sm mb-4">
                Conecta Meta / Google cuando integres píxeles y conversiones.
              </p>
              <button type="button" className="text-sm font-medium text-purple-700 hover:text-purple-900">
                Más información
              </button>
            </div>
            <div className="w-14 h-14 bg-purple-200 rounded-lg flex items-center justify-center shrink-0">
              <BarChart3 className="h-7 w-7 text-purple-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string;
  change: number;
  trend: 'increase' | 'decrease';
  icon: LucideIcon;
  accent: 'blue' | 'emerald' | 'violet' | 'amber';
}) {
  const up = trend === 'increase';
  const ring: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    violet: 'bg-violet-100 text-violet-600',
    amber: 'bg-amber-100 text-amber-600',
  };
  return (
    <div className="metric-card">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="metric-label">{title}</p>
          <p className="metric-value">{value}</p>
          <div className="flex items-center gap-1 mt-1">
            {up ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
            <span className={`text-sm font-medium ${up ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(change)}%
            </span>
          </div>
        </div>
        <div className={`p-3 rounded-lg ${ring[accent]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
