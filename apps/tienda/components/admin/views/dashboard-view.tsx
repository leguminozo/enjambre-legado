'use client';

import { useEffect, useMemo, useState } from 'react';
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
  Zap,
  Shield,
  Loader2
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  AreaChart,
  Area
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

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="space-y-12 animate-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-[#c9a227]/10 flex items-center justify-center text-[#c9a227]">
              <BarChart3 size={20} />
            </div>
            <h1 className="font-display text-4xl font-light tracking-tight text-[#f5f0e8]">Estado Operativo</h1>
          </div>
          <p className="text-[#8a8279] text-sm tracking-wide">Analítica en tiempo real del ecosistema comercial</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
           <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[0.65rem] text-[#8a8279] uppercase tracking-widest">
              <Eye size={14} className="text-[#c9a227]" />
              <span className="text-[#f5f0e8] font-bold">{liveVisitors}</span> en vivo
           </div>
           
           <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as DashboardPeriod)}
              className="bg-[#0a0a0a] border border-white/10 rounded-full px-6 py-2 text-[0.65rem] text-[#f5f0e8] uppercase tracking-[0.2em] focus:outline-none focus:border-[#c9a227] transition-all cursor-pointer"
            >
              <option value="7d">Ciclo 7 Días</option>
              <option value="30d">Ciclo 30 Días</option>
              <option value="90d">Ciclo Trimestral</option>
            </select>
        </div>
      </div>

      {/* Metric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Sesiones"
          value={formatNumber(overview.sessions.current)}
          change={overview.sessions.change}
          trend={overview.sessions.trend}
          icon={Activity}
        />
        <MetricCard
          title="Ingresos Brutos"
          value={formatCurrency(overview.totalSales.current)}
          change={overview.totalSales.change}
          trend={overview.totalSales.trend}
          icon={DollarSign}
        />
        <MetricCard
          title="Órdenes"
          value={formatNumber(overview.orders.current)}
          change={overview.orders.change}
          trend={overview.orders.trend}
          icon={ShoppingCart}
        />
        <MetricCard
          title="Conversión"
          value={`${overview.conversionRate.current}%`}
          change={overview.conversionRate.change}
          trend={overview.conversionRate.trend}
          icon={Target}
        />
      </div>

      {/* Main Chart Section */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-b from-[#c9a227]/10 to-transparent blur-3xl opacity-20 pointer-events-none" />
        <div className="relative bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 lg:p-10 shadow-2xl overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
            <div>
              <h2 className="font-display text-2xl text-[#f5f0e8]">Fluctuación de Audiencia</h2>
              <p className="text-[0.65rem] text-[#8a8279] uppercase tracking-[0.2em] mt-1">Interacción vs Período Anterior</p>
            </div>
            <div className="flex items-center gap-6 text-[0.6rem] uppercase tracking-widest font-bold">
              <span className="flex items-center gap-2 text-[#c9a227]">
                <span className="w-2 h-2 bg-[#c9a227] rounded-full" /> Actual
              </span>
              <span className="flex items-center gap-2 text-[#4a4a4a]">
                <span className="w-2 h-2 bg-white/10 rounded-full border border-white/20" /> Anterior
              </span>
            </div>
          </div>
          
          <div className="h-[400px] w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.sessions}>
                  <defs>
                    <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c9a227" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#c9a227" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" strokeOpacity={0.03} vertical={false} />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#4a4a4a' }}
                    tickFormatter={(v) =>
                      new Date(v).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' })
                    }
                    dy={15}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#4a4a4a' }}
                    dx={-10}
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#111111', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#f5f0e8'
                    }}
                    itemStyle={{ color: '#c9a227' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="current" 
                    stroke="#c9a227" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorCurrent)" 
                  />
                  <Area
                    type="monotone"
                    dataKey="previous"
                    stroke="#ffffff"
                    strokeOpacity={0.1}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    fill="transparent"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                 <Loader2 className="animate-spin text-[#c9a227]" size={24} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Insights / Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-8 rounded-3xl bg-[#0a0a0a] border border-white/5 hover:border-[#c9a227]/20 transition-all group overflow-hidden relative">
          <Zap className="absolute -right-4 -top-4 w-24 h-24 text-white/[0.02] group-hover:text-[#c9a227]/5 transition-all" />
          <h3 className="text-[#f5f0e8] font-display text-xl mb-3">Pulso Crítico</h3>
          <p className="text-sm text-[#8a8279] leading-relaxed mb-6">Se detectó una anomalía positiva en el checkout desde Chiloé. El 40% de los carritos abandonados se recuperaron tras la última actualización.</p>
          <button className="text-[0.6rem] uppercase tracking-widest text-[#c9a227] font-bold border-b border-[#c9a227]/30 pb-1">Analizar Flujo</button>
        </div>

        <div className="p-8 rounded-3xl bg-[#0a0a0a] border border-white/5 hover:border-[#c9a227]/20 transition-all group overflow-hidden relative">
          <Shield className="absolute -right-4 -top-4 w-24 h-24 text-white/[0.02] group-hover:text-[#c9a227]/5 transition-all" />
          <h3 className="text-[#f5f0e8] font-display text-xl mb-3">Blindaje Operativo</h3>
          <p className="text-sm text-[#8a8279] leading-relaxed mb-6">Todas las integraciones de pago (Transbank) están operando al 100% de eficiencia técnica. Sincronización con SII completada hace 2h.</p>
          <button className="text-[0.6rem] uppercase tracking-widest text-[#c9a227] font-bold border-b border-[#c9a227]/30 pb-1">Ver Reporte SII</button>
        </div>

        <div className="p-8 rounded-3xl bg-gradient-to-br from-[#c9a227]/10 to-transparent border border-[#c9a227]/20 relative overflow-hidden group">
          <div className="relative z-10">
            <h3 className="text-[#f5f0e8] font-display text-xl mb-3">Vanguardia Activa</h3>
            <p className="text-sm text-[#8a8279] leading-relaxed mb-6">Tu tienda ha plantado 154 árboles en el último ciclo de facturación. El legado regenerativo sigue creciendo.</p>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
               <div className="h-full bg-[#c9a227] w-[70%] shadow-[0_0_10px_#c9a227]" />
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
}: {
  title: string;
  value: string;
  change: number;
  trend: 'increase' | 'decrease';
  icon: LucideIcon;
}) {
  const up = trend === 'increase';
  return (
    <div className="p-8 rounded-3xl bg-[#0a0a0a] border border-white/5 hover:border-[#c9a227]/30 transition-all group shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="p-3 rounded-xl bg-white/5 text-[#8a8279] group-hover:bg-[#c9a227]/10 group-hover:text-[#c9a227] transition-all">
          <Icon size={20} />
        </div>
        <div className={`flex items-center gap-1 text-[0.65rem] font-bold uppercase tracking-wider ${up ? 'text-emerald-500' : 'text-red-400'}`}>
           {up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
           {Math.abs(change)}%
        </div>
      </div>
      <div>
        <p className="text-[0.6rem] uppercase tracking-[0.2em] text-[#8a8279] mb-1">{title}</p>
        <p className="text-2xl font-display text-[#f5f0e8] tracking-tight">{value}</p>
      </div>
    </div>
  );
}
