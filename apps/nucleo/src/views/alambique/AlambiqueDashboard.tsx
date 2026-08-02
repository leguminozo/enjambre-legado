'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge } from '@enjambre/ui';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { ChartBox } from '@/components/charts/ChartBox';
import { FlaskConical, Droplets, Sprout, Timer, TrendingUp, Activity } from 'lucide-react';
import type { DashboardData } from './alambique-types';

interface AlambiqueDashboardProps {
  data: DashboardData;
  isLoading: boolean;
}

const ESTADO_BADGE: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  planificada: 'default',
  en_proceso: 'warning',
  finalizada: 'success',
  descartada: 'danger',
};

export function AlambiqueDashboard({ data, isLoading }: AlambiqueDashboardProps) {
  const { stats, por_planta, ultimas } = data;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 bg-surface-sunken rounded-2xl border border-border" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-surface-sunken border-border">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-xl text-primary">
              <FlaskConical size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Destilaciones</p>
              <p className="text-3xl font-display mt-1">{stats.total_destilaciones}</p>
              <p className="text-xs text-muted-foreground mt-1">{stats.en_proceso} en proceso</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface-sunken border-border">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-accent/10 p-3 rounded-xl text-accent">
              <Droplets size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Hidrolato total</p>
              <p className="text-3xl font-display mt-1">{(stats.total_hidrolato_ml / 1000).toFixed(1)} L</p>
              <p className="text-xs text-muted-foreground mt-1">{stats.total_aceite_ml.toFixed(1)} ml de aceite esencial</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface-sunken border-border">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-success/10 p-3 rounded-xl text-success">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Rendimiento</p>
              <p className="text-3xl font-display mt-1">{stats.rendimiento_ml_por_kg} ml/kg</p>
              <p className="text-xs text-muted-foreground mt-1">hidrolato por kg de carga</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface-sunken border-border">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-secondary/10 p-3 rounded-xl text-secondary-foreground">
              <Sprout size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Materias primas</p>
              <p className="text-3xl font-display mt-1">{stats.total_plantas}</p>
              <p className="text-xs text-muted-foreground mt-1">plantas registradas</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface-sunken border-border">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-warning/10 p-3 rounded-xl text-warning">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Aceite esencial</p>
              <p className="text-3xl font-display mt-1">{stats.total_aceite_ml} ml</p>
              <p className="text-xs text-muted-foreground mt-1">acumulado en el alambique</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface-sunken border-border">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-xl text-primary">
              <Timer size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Última corrida</p>
              <p className="text-lg font-display mt-1 truncate">
                {ultimas[0]?.codigo ?? 'Sin corridas'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {ultimas[0] ? new Date(ultimas[0].fecha_inicio).toLocaleDateString('es-CL') : '—'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparativa por planta */}
      <Card>
        <CardHeader>
          <CardTitle>Hidrolato por planta</CardTitle>
          <CardDescription>Volumen acumulado de hidrolato (ml) por especie destilada — la memoria del alambique.</CardDescription>
        </CardHeader>
        <CardContent>
          {por_planta.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aún no hay destilaciones para comparar.</p>
          ) : (
            <ChartBox height={260}>
              <BarChart data={por_planta} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.4)" />
                <XAxis
                  dataKey="nombre"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--card) / 0.95)',
                    backdropFilter: 'blur(8px)',
                    color: 'hsl(var(--foreground))',
                    fontSize: '12px',
                  }}
                  formatter={(value, name) =>
                    name === 'hidrolato_ml'
                      ? [`${Number(value ?? 0).toLocaleString('es-CL')} ml`, 'Hidrolato']
                      : [String(value ?? ''), String(name)]
                  }
                />
                <Bar dataKey="hidrolato_ml" name="hidrolato_ml" radius={[6, 6, 0, 0]}>
                  {por_planta.map((_, i) => (
                    <Cell key={i} fill={i % 2 === 0 ? 'hsl(var(--primary))' : 'hsl(var(--accent))'} />
                  ))}
                </Bar>
              </BarChart>
            </ChartBox>
          )}
        </CardContent>
      </Card>

      {/* Últimas corridas */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas destilaciones</CardTitle>
          <CardDescription>Las corridas más recientes del alambique.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {ultimas.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Registra tu primera destilación para comenzar la bitácora.</p>
          ) : (
            <div className="divide-y divide-border">
              {ultimas.map((u) => (
                <div key={u.id} className="flex items-center gap-4 p-4 md:px-6 hover:bg-surface-sunken/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm font-medium text-primary">{u.codigo ?? 'Sin código'}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {u.planta || 'Sin planta'} • {new Date(u.fecha_inicio).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium text-foreground">
                      {u.rendimiento_hidrolato_ml != null ? `${u.rendimiento_hidrolato_ml.toFixed(0)} ml` : '—'}
                    </p>
                  </div>
                  <Badge variant={ESTADO_BADGE[u.estado] ?? 'default'}>
                    {u.estado.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
