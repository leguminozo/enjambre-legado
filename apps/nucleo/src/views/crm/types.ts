import React from "react";
import { Phone, Mail, MapPin, Store, MessageSquare, Users, Clock } from "lucide-react";
import { BOSQUE_ULMO, ORO_MIEL } from "@/lib/colors";

export type Rep = {
  rep_id: string;
  display_name: string;
  clients_captured: number;
  total_sales: number;
  total_revenue: number;
  commission_balance: number;
  streak: number;
  tier: string;
};

export type Cliente = {
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

export type Interaccion = {
  id: string;
  cliente_id: string;
  rep_id: string;
  tipo: string;
  notas: string | null;
  resultado: string | null;
  proximo_seguimiento: string | null;
  created_at: string;
};

export type EventoCRM = {
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

export type CRMDashboard = {
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

export const TIER_COLORS: Record<string, string> = {
  base: "hsl(var(--muted-foreground))",
  senior: ORO_MIEL,
  elite: BOSQUE_ULMO,
  legend: "hsl(var(--destructive))",
};

export const TIER_BADGE: Record<string, string> = {
  base: "bg-surface-raised text-muted-foreground border-border",
  senior: "bg-accent/15 text-accent border-accent/30",
  elite: "bg-primary/15 text-primary border-primary/30",
  legend: "bg-destructive/15 text-destructive border-destructive/30",
};

export const TIPO_ICONS: Record<string, React.ReactNode> = {
  llamada: React.createElement(Phone, { size: 14 }),
  email: React.createElement(Mail, { size: 14 }),
  visita: React.createElement(MapPin, { size: 14 }),
  feria: React.createElement(Store, { size: 14 }),
  whatsapp: React.createElement(MessageSquare, { size: 14 }),
  reunion: React.createElement(Users, { size: 14 }),
  seguimiento: React.createElement(Clock, { size: 14 }),
  otro: React.createElement(MessageSquare, { size: 14 }),
};

export const RESULTADO_COLORS: Record<string, string> = {
  positivo: "text-success",
  neutral: "text-muted-foreground",
  negativo: "text-destructive",
  pendiente: "text-warning",
  seguimiento: "text-info",
};

export const STATUS_COLORS: Record<string, string> = {
  activo: "bg-success/15 text-success border-success/30",
  frecuente: "bg-accent/15 text-accent border-accent/30",
  prospecto: "bg-info/15 text-info border-info/30",
  inactivo: "bg-surface-raised text-muted-foreground border-border",
};

export const EMPTY_DASHBOARD: CRMDashboard = {
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
