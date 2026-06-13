'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  Calendar,
  MessageSquare,
  TrendingUp,
  Target,
  Award,
  Clock,
  ChevronDown,
  ChevronRight,
  Plus,
  X,
  Loader2,
  Search,
  Filter,
  Star,
  Briefcase,
  Store,
} from 'lucide-react';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { toast } from '@enjambre/ui';
import { BOSQUE_ULMO, ORO_MIEL } from '@/lib/colors';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

type Rep = {
  rep_id: string;
  display_name: string;
  clients_captured: number;
  total_sales: number;
  total_revenue: number;
  commission_balance: number;
  streak: number;
  tier: string;
};

type Cliente = {
  id: string;
  name: string;
  type: string | null;
  status: string | null;
  total_spent: number | null;
  last_purchase: string | null;
  fuente: string | null;
  email: string | null;
  telefono: string | null;
  empresa: string | null;
  vendedor_id: string | null;
  ultimo_contacto: string | null;
  notes: string | null;
};

type Interaccion = {
  id: string;
  cliente_id: string;
  rep_id: string;
  tipo: string;
  notas: string | null;
  resultado: string | null;
  proximo_seguimiento: string | null;
  created_at: string;
};

type EventoCRM = {
  id: string;
  nombre: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  ubicacion: unknown;
  reps: Array<{
    id: string;
    evento_id: string;
    rep_id: string;
    rol_evento: string;
    meta_ventas: number;
  }>;
};

type CRMDashboard = {
  reps: Rep[];
  clientes: Cliente[];
  interacciones: Interaccion[];
  eventos: EventoCRM[];
  assignments: Array<{
    id: string;
    evento_id: string;
    rep_id: string;
    rol_evento: string;
    meta_ventas: number;
  }>;
  stats: {
    totalClientes: number;
    clientesByStatus: Record<string, number>;
    clientesByFuente: Record<string, number>;
    interaccionesTotal: number;
    interaccionesByTipo: Record<string, number>;
    interaccionesByResultado: Record<string, number>;
    proximosSeguimientos: number;
    totalVentas: number;
    newClients: number;
    conversionRate: number;
    channelRevenue: Record<string, number>;
    channelCount: Record<string, number>;
    activeReps: number;
    upcomingEventos: number;
  };
};

const TIER_COLORS: Record<string, string> = {
  base: 'hsl(var(--muted-foreground))',
  senior: ORO_MIEL,
  elite: BOSQUE_ULMO,
  legend: 'hsl(var(--destructive))',
};

const TIER_BADGE: Record<string, string> = {
  base: 'bg-surface-raised text-muted-foreground border-border',
  senior: 'bg-accent/15 text-accent border-accent/30',
  elite: 'bg-primary/15 text-primary border-primary/30',
  legend: 'bg-destructive/15 text-destructive border-destructive/30',
};

const TIPO_ICONS: Record<string, React.ReactNode> = {
  llamada: <Phone size={14} />,
  email: <Mail size={14} />,
  visita: <MapPin size={14} />,
  feria: <Store size={14} />,
  whatsapp: <MessageSquare size={14} />,
  reunion: <Users size={14} />,
  seguimiento: <Clock size={14} />,
  otro: <MessageSquare size={14} />,
};

const RESULTADO_COLORS: Record<string, string> = {
  positivo: 'text-success',
  neutral: 'text-muted-foreground',
  negativo: 'text-destructive',
  pendiente: 'text-warning',
  seguimiento: 'text-info',
};

const STATUS_COLORS: Record<string, string> = {
  activo: 'bg-success/15 text-success border-success/30',
  frecuente: 'bg-accent/15 text-accent border-accent/30',
  prospecto: 'bg-info/15 text-info border-info/30',
  inactivo: 'bg-surface-raised text-muted-foreground border-border',
};

const EMPTY_DASHBOARD: CRMDashboard = {
  reps: [],
  clientes: [],
  interacciones: [],
  eventos: [],
  assignments: [],
  stats: {
    totalClientes: 0,
    clientesByStatus: {},
    clientesByFuente: {},
    interaccionesTotal: 0,
    interaccionesByTipo: {},
    interaccionesByResultado: {},
    proximosSeguimientos: 0,
    totalVentas: 0,
    newClients: 0,
    conversionRate: 0,
    channelRevenue: {},
    channelCount: {},
    activeReps: 0,
    upcomingEventos: 0,
  },
};

export function CRMView() {
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'overview' | 'clientes' | 'interacciones' | 'ferias'>('overview');
  const [searchQ, setSearchQ] = useState('');
  const [showNewCliente, setShowNewCliente] = useState(false);
  const [showNewInteraccion, setShowNewInteraccion] = useState(false);
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);
  const [newClienteForm, setNewClienteForm] = useState({
    name: '',
    type: 'Particular' as const,
    email: '',
    telefono: '',
    empresa: '',
    fuente: 'feria' as const,
  });
  const [newInteraccionForm, setNewInteraccionForm] = useState({
    cliente_id: '',
    tipo: 'llamada' as const,
    notas: '',
    resultado: 'pendiente' as const,
    proximo_seguimiento: '',
  });

  const { data, isLoading, error, refetch } = useQuery<{ data: CRMDashboard }>({
    queryKey: ['crm', 'dashboard'],
    queryFn: async () => {
      const res = await apiFetch('/api/crm/dashboard');
      if (!res.ok) throw new Error('Failed to fetch CRM');
      return res.json();
    },
    staleTime: 30_000,
  });

  const dashboard = data?.data ?? EMPTY_DASHBOARD;
  const stats = dashboard.stats;

  const createCliente = useMutation({
    mutationFn: async (form: typeof newClienteForm) => {
      const res = await apiFetch('/api/crm/clientes', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Create failed' }));
        throw new Error(err.message ?? 'Create failed');
      }
      return res.json();
    },
    onSuccess: () => {
      toast('Cliente creado', { type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['crm'] });
      setShowNewCliente(false);
      setNewClienteForm({ name: '', type: 'Particular', email: '', telefono: '', empresa: '', fuente: 'feria' });
    },
    onError: (err) => toast(err.message, { type: 'error' }),
  });

  const createInteraccion = useMutation({
    mutationFn: async (form: typeof newInteraccionForm) => {
      const res = await apiFetch('/api/crm/interacciones', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Create failed' }));
        throw new Error(err.message ?? 'Create failed');
      }
      return res.json();
    },
    onSuccess: () => {
      toast('Interacción registrada', { type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['crm'] });
      setShowNewInteraccion(false);
      setNewInteraccionForm({ cliente_id: '', tipo: 'llamada', notas: '', resultado: 'pendiente', proximo_seguimiento: '' });
    },
    onError: (err) => toast(err.message, { type: 'error' }),
  });

  const filteredClientes = useMemo(() => {
    if (!searchQ) return dashboard.clientes;
    const q = searchQ.toLowerCase();
    return dashboard.clientes.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.empresa?.toLowerCase().includes(q)
    );
  }, [dashboard.clientes, searchQ]);

  const channelData = Object.entries(stats.channelRevenue).map(([ch, rev]) => ({
    name: ch,
    revenue: Number(rev),
    count: stats.channelCount[ch] ?? 0,
  }));

  const statusPieData = Object.entries(stats.clientesByStatus).map(([s, count]) => ({
    name: s,
    value: count,
  }));

  const fuenteData = Object.entries(stats.clientesByFuente).map(([f, count]) => ({
    name: f,
    value: count,
  }));

  const tabs = [
    { key: 'overview' as const, label: 'Vista General', icon: <TrendingUp size={16} /> },
    { key: 'clientes' as const, label: 'Clientes', icon: <Users size={16} /> },
    { key: 'interacciones' as const, label: 'Interacciones', icon: <MessageSquare size={16} /> },
    { key: 'ferias' as const, label: 'Agenda Ferias', icon: <Calendar size={16} /> },
  ];

  return (
    <div className="space-y-6 animate-in">
      <div className="hero-banner">
        <h1 className="hero-title">CRM de Vendedores</h1>
        <p className="hero-subtitle">Historial de interacciones, métricas de conversión y agenda de ferias</p>
      </div>

      <div className="stats-grid">
        {[
          { icon: <Users size={20} />, val: String(stats.totalClientes), label: 'Total Clientes' },
          { icon: <Target size={20} />, val: `${stats.conversionRate}%`, label: 'Conversión' },
          { icon: <MessageSquare size={20} />, val: String(stats.interaccionesTotal), label: 'Interacciones', trend: stats.proximosSeguimientos > 0 ? `${stats.proximosSeguimientos} seguimientos` : undefined },
          { icon: <Calendar size={20} />, val: String(stats.upcomingEventos), label: 'Próximas Ferias' },
        ].map((s, i) => (
          <div key={i} className={`stat-card animate-in delay-${i + 1}`}>
            <div className="stat-header">
              <div className="stat-icon">{s.icon}</div>
              {s.trend && <span className="stat-trend up">{s.trend}</span>}
            </div>
            <div className="stat-value">{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 border-b border-border pb-0">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
              tab === t.key
                ? 'border-accent text-accent'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-accent" />
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive text-destructive text-sm">
          Error: {error.message}
        </div>
      )}

      {!isLoading && !error && tab === 'overview' && (
        <div className="dashboard-grid dashboard-grid-2 space-y-6">
          <div className="space-y-6">
            <div className="card animate-in delay-2">
              <div className="section-header">
                <div className="section-title">Rendimiento Reps</div>
              </div>
              <div className="space-y-2">
                {dashboard.reps
                  .sort((a, b) => b.total_revenue - a.total_revenue)
                  .map((rep) => (
                    <div
                      key={rep.rep_id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-surface-sunken border border-border"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground truncate">
                            {rep.display_name}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-xs font-medium border ${
                              TIER_BADGE[rep.tier] ?? TIER_BADGE.base
                            }`}
                          >
                            {rep.tier}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {rep.total_sales} ventas · {rep.clients_captured} clientes · {rep.streak} días racha
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-semibold text-foreground">
                          ${Number(rep.total_revenue).toLocaleString('es-CL')}
                        </div>
                        {rep.commission_balance > 0 && (
                          <div className="text-xs text-accent">
                            ${Number(rep.commission_balance).toLocaleString('es-CL')} pend.
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                {dashboard.reps.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    Sin reps activos
                  </div>
                )}
              </div>
            </div>

            {channelData.length > 0 && (
              <div className="card animate-in delay-3">
                <div className="section-header">
                  <div className="section-title">Ventas por Canal</div>
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={channelData}>
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        formatter={(val: unknown) => [`$${Number(val).toLocaleString('es-CL')}`, 'Ingresos']}
                      />
                      <Bar dataKey="revenue" fill={BOSQUE_ULMO} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {statusPieData.length > 0 && (
              <div className="card animate-in delay-3">
                <div className="section-header">
                  <div className="section-title">Clientes por Estado</div>
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {statusPieData.map((_, idx) => (
                          <Cell
                            key={idx}
                            fill={[BOSQUE_ULMO, ORO_MIEL, 'hsl(var(--muted-foreground))', 'hsl(var(--destructive))'][idx % 4]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-3 px-2">
                  {statusPieData.map((s) => (
                    <span key={s.name} className="text-xs text-muted-foreground">
                      {s.name}: <strong className="text-foreground">{s.value}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="card animate-in delay-4">
              <div className="section-header">
                <div className="section-title">Últimas Interacciones</div>
              </div>
              <div className="space-y-2">
                {dashboard.interacciones.slice(0, 8).map((inter) => {
                  const cliente = dashboard.clientes.find((c) => c.id === inter.cliente_id);
                  return (
                    <div
                      key={inter.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-raised/50 transition-colors"
                    >
                      <div className="text-muted-foreground">
                        {TIPO_ICONS[inter.tipo] ?? <MessageSquare size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-foreground truncate">
                          {cliente?.name ?? 'Cliente'}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {inter.tipo} · {new Date(inter.created_at).toLocaleDateString('es-CL')}
                        </div>
                      </div>
                      {inter.resultado && (
                        <span className={`text-xs font-medium ${RESULTADO_COLORS[inter.resultado] ?? ''}`}>
                          {inter.resultado}
                        </span>
                      )}
                    </div>
                  );
                })}
                {dashboard.interacciones.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    Sin interacciones registradas
                  </div>
                )}
              </div>
            </div>

            {fuenteData.length > 0 && (
              <div className="card animate-in delay-5">
                <div className="section-header">
                  <div className="section-title">Fuentes de Clientes</div>
                </div>
                <div className="space-y-2">
                  {fuenteData
                    .sort((a, b) => b.value - a.value)
                    .map((f) => {
                      const pct = stats.totalClientes > 0 ? Math.round((f.value / stats.totalClientes) * 100) : 0;
                      return (
                        <div key={f.name} className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-20 truncate">{f.name}</span>
                          <div className="flex-1 h-2 rounded-full bg-surface-sunken overflow-hidden">
                            <div
                              className="h-full rounded-full bg-accent"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-foreground w-8 text-right">{pct}%</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!isLoading && !error && tab === 'clientes' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Buscar por nombre, email o empresa..."
                className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <button
              onClick={() => setShowNewCliente(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
            >
              <UserPlus size={16} />
              Nuevo
            </button>
          </div>

          {showNewCliente && (
            <div className="p-4 bg-surface rounded-xl border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Nuevo Cliente</span>
                <button onClick={() => setShowNewCliente(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Nombre *"
                  value={newClienteForm.name}
                  onChange={(e) => setNewClienteForm((f) => ({ ...f, name: e.target.value }))}
                  className="bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <select
                  value={newClienteForm.type}
                  onChange={(e) => setNewClienteForm((f) => ({ ...f, type: e.target.value as typeof newClienteForm.type }))}
                  className="bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="Particular">Particular</option>
                  <option value="B2B">B2B</option>
                  <option value="Gourmet">Gourmet</option>
                  <option value="Retail">Retail</option>
                  <option value="Exportacion">Exportación</option>
                  <option value="D2C">D2C</option>
                </select>
                <input
                  type="email"
                  placeholder="Email"
                  value={newClienteForm.email}
                  onChange={(e) => setNewClienteForm((f) => ({ ...f, email: e.target.value }))}
                  className="bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <input
                  type="text"
                  placeholder="Teléfono"
                  value={newClienteForm.telefono}
                  onChange={(e) => setNewClienteForm((f) => ({ ...f, telefono: e.target.value }))}
                  className="bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <input
                  type="text"
                  placeholder="Empresa"
                  value={newClienteForm.empresa}
                  onChange={(e) => setNewClienteForm((f) => ({ ...f, empresa: e.target.value }))}
                  className="bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <select
                  value={newClienteForm.fuente}
                  onChange={(e) => setNewClienteForm((f) => ({ ...f, fuente: e.target.value as typeof newClienteForm.fuente }))}
                  className="bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="feria">Feria</option>
                  <option value="referido">Referido</option>
                  <option value="web">Web</option>
                  <option value="visita">Visita</option>
                  <option value="cold_call">Cold Call</option>
                  <option value="red_social">Red Social</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowNewCliente(false)} className="px-3 py-2 rounded-lg text-xs font-medium border border-border hover:border-accent/50 transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={() => createCliente.mutate(newClienteForm)}
                  disabled={createCliente.isPending || !newClienteForm.name}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-accent text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50"
                >
                  {createCliente.isPending ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                  Crear
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {filteredClientes.map((cliente) => (
              <div
                key={cliente.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border hover:border-accent/30 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedClienteId(selectedClienteId === cliente.id ? null : cliente.id);
                  setNewInteraccionForm((f) => ({ ...f, cliente_id: cliente.id }));
                }}
              >
                <div className="w-10 h-10 rounded-lg bg-surface-sunken flex items-center justify-center text-accent shrink-0">
                  <Users size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">{cliente.name}</span>
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${STATUS_COLORS[cliente.status ?? 'prospecto'] ?? STATUS_COLORS.prospecto}`}>
                      {cliente.status ?? 'prospecto'}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">
                    {cliente.type && `${cliente.type} · `}
                    {cliente.email && `${cliente.email} · `}
                    {cliente.total_spent != null ? `$${Number(cliente.total_spent).toLocaleString('es-CL')}` : 'Sin compras'}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {cliente.fuente && (
                    <span className="text-xs text-muted-foreground">{cliente.fuente}</span>
                  )}
                  {cliente.ultimo_contacto && (
                    <div className="text-[11px] text-muted-foreground">
                      {new Date(cliente.ultimo_contacto).toLocaleDateString('es-CL')}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {filteredClientes.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                <Users size={32} className="mx-auto mb-2 opacity-50" />
                {searchQ ? `Sin resultados para "${searchQ}"` : 'Sin clientes registrados'}
              </div>
            )}
          </div>
        </div>
      )}

      {!isLoading && !error && tab === 'interacciones' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{stats.interaccionesTotal} interacciones</span>
            <button
              onClick={() => setShowNewInteraccion(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
            >
              <Plus size={16} />
              Registrar
            </button>
          </div>

          {showNewInteraccion && (
            <div className="p-4 bg-surface rounded-xl border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Nueva Interacción</span>
                <button onClick={() => setShowNewInteraccion(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={newInteraccionForm.cliente_id}
                  onChange={(e) => setNewInteraccionForm((f) => ({ ...f, cliente_id: e.target.value }))}
                  className="bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">Seleccionar cliente</option>
                  {dashboard.clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <select
                  value={newInteraccionForm.tipo}
                  onChange={(e) => setNewInteraccionForm((f) => ({ ...f, tipo: e.target.value as typeof newInteraccionForm.tipo }))}
                  className="bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="llamada">Llamada</option>
                  <option value="email">Email</option>
                  <option value="visita">Visita</option>
                  <option value="feria">Feria</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="reunion">Reunión</option>
                  <option value="seguimiento">Seguimiento</option>
                  <option value="otro">Otro</option>
                </select>
                <select
                  value={newInteraccionForm.resultado}
                  onChange={(e) => setNewInteraccionForm((f) => ({ ...f, resultado: e.target.value as typeof newInteraccionForm.resultado }))}
                  className="bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="positivo">Positivo</option>
                  <option value="neutral">Neutral</option>
                  <option value="negativo">Negativo</option>
                  <option value="seguimiento">Seguimiento</option>
                </select>
                <input
                  type="date"
                  value={newInteraccionForm.proximo_seguimiento}
                  onChange={(e) => setNewInteraccionForm((f) => ({ ...f, proximo_seguimiento: e.target.value }))}
                  placeholder="Próximo seguimiento"
                  className="bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <textarea
                value={newInteraccionForm.notas}
                onChange={(e) => setNewInteraccionForm((f) => ({ ...f, notas: e.target.value }))}
                placeholder="Notas de la interacción..."
                rows={3}
                className="w-full bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-y"
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowNewInteraccion(false)} className="px-3 py-2 rounded-lg text-xs font-medium border border-border hover:border-accent/50 transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={() => createInteraccion.mutate(newInteraccionForm)}
                  disabled={createInteraccion.isPending || !newInteraccionForm.cliente_id}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-accent text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50"
                >
                  {createInteraccion.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Registrar
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {dashboard.interacciones.map((inter) => {
              const cliente = dashboard.clientes.find((c) => c.id === inter.cliente_id);
              return (
                <div
                  key={inter.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-surface border border-border"
                >
                  <div className="text-muted-foreground mt-0.5">
                    {TIPO_ICONS[inter.tipo] ?? <MessageSquare size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{cliente?.name ?? 'Cliente'}</span>
                      <span className={`text-xs font-medium ${RESULTADO_COLORS[inter.resultado ?? 'pendiente'] ?? ''}`}>
                        {inter.resultado ?? 'pendiente'}
                      </span>
                    </div>
                    {inter.notas && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{inter.notas}</p>
                    )}
                    {inter.proximo_seguimiento && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-accent">
                        <Clock size={12} />
                        Seguimiento: {new Date(inter.proximo_seguimiento).toLocaleDateString('es-CL')}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0">
                    {new Date(inter.created_at).toLocaleDateString('es-CL')}
                  </div>
                </div>
              );
            })}
            {dashboard.interacciones.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
                Sin interacciones registradas
              </div>
            )}
          </div>
        </div>
      )}

      {!isLoading && !error && tab === 'ferias' && (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {stats.upcomingEventos} evento(s) programado(s)
          </div>

          <div className="space-y-3">
            {dashboard.eventos.map((evento) => {
              const assignedReps = evento.reps ?? [];
              return (
                <div
                  key={evento.id}
                  className="p-4 rounded-xl bg-surface border border-border space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">
                        {evento.nombre ?? 'Evento sin nombre'}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Calendar size={12} />
                        {evento.fecha_inicio && new Date(evento.fecha_inicio).toLocaleDateString('es-CL')}
                        {evento.fecha_fin && ` — ${new Date(evento.fecha_fin).toLocaleDateString('es-CL')}`}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-accent/15 text-accent border border-accent/30">
                      Feria
                    </span>
                  </div>

                  {assignedReps.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Reps asignados
                      </span>
                      {assignedReps.map((a) => {
                        const rep = dashboard.reps.find((r) => r.rep_id === a.rep_id);
                        return (
                          <div key={a.id} className="flex items-center gap-2 text-xs">
                            <span className="text-foreground font-medium">{rep?.display_name ?? a.rep_id.slice(0, 8)}</span>
                            <span className="text-muted-foreground">({a.rol_evento})</span>
                            {a.meta_ventas > 0 && (
                              <span className="text-accent">Meta: ${Number(a.meta_ventas).toLocaleString('es-CL')}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            {dashboard.eventos.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                Sin eventos programados
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
