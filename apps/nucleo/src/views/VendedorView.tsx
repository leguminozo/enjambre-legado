import { useState, useEffect, useMemo } from 'react';
import { ShoppingBag, Users, MapPin, CalendarDays, TrendingUp, Star, ArrowUpRight, QrCode, Truck, X, ChevronDown, Plus, Minus } from 'lucide-react';
import type { Product } from '@/types/ecosystem';
import { guardianLevel } from '@/types/ecosystem';
import { supabase } from '../lib/supabase';
import { friendlyError, toast, QRCode as QRCodeSvg, ImmersiveModal } from '@enjambre/ui';
import { getUrlTienda } from '@/lib/publicUrls';
import { useAuthStore } from '@enjambre/auth';
import { ViewShell } from '@/components/layout/ViewShell';
import { useApiFetch } from '@/hooks/use-api-fetch';
import type { CRMDashboard } from '@/views/crm/types';

function mapProductoRow(p: Record<string, unknown>): Product {
  const precio = Number(p.precio) || 0;
  return {
    id: String(p.id),
    name: String(p.nombre ?? 'Producto'),
    description: String(p.descripcion_regenerativa ?? ''),
    price: precio,
    format: String(p.formato ?? ''),
    impactTrees: Math.max(1, Math.floor(precio / 50000) || 1),
    emoji: '🍯',
    stock: Number(p.stock) || 0,
    category: String(p.categoria ?? p.formato ?? 'Legado'),
  };
}

function mapClientType(t: string): string {
  if (t === 'Particular') return 'D2C';
  if (t === 'Chef' || t === 'Reseller') return 'B2B';
  if (t === 'Deportivo') return 'Retail';
  return 'D2C';
}

interface FeriaItem {
  id: string;
  name: string;
  date: string;
  estimated: string;
  status: string;
}

function formatEventoDate(inicio: string | null, fin: string | null): string {
  if (!inicio) return 'Sin fecha';
  const start = new Date(inicio).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
  if (!fin || fin === inicio) return start;
  const end = new Date(fin).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
  return `${start} – ${end}`;
}

function feriaStatus(inicio: string | null): string {
  if (!inicio) return 'Pendiente';
  const today = new Date().toISOString().slice(0, 10);
  if (inicio <= today) return 'En curso';
  const daysUntil = Math.ceil((new Date(inicio).getTime() - Date.now()) / 86_400_000);
  if (daysUntil <= 14) return 'Confirmada';
  return 'Programada';
}

const pitches: Record<string, string> = {
  '🏋️ Deportista': '"Cada sachet de Gotas de Néctar es una dosis de 15g de energía pura del bosque patagónico. Ideal para pre o post entreno. Sin azúcar añadida, cargada de antioxidantes. Y con cada sachet, plantas 0.3 árboles nativos en Chiloé."',
  '👨‍🍳 Chef': '"El panal natural completo es una experiencia gastronómica que tus comensales no olvidarán. Textura, aroma y sabor del bosque de ulmo directo a la mesa. Ideal para tablas, postres y maridaje con quesos de Chiloé. Cada panal regenera 3 árboles nativos."',
  '🏪 Tienda': '"Nuestros sachets son el formato con mayor rotación: margen 72%, presentación premium, storytelling regenerativo que fideliza. Incluimos material POP y QR de trazabilidad. Condiciones especiales para resellers desde 50 unidades."',
  '🎁 Regalo': '"El Cofre Legado del Bosque es un regalo que trasciende: miel virgen + crema artesanal + sachets + hidrolato. Cada cofre planta 5 árboles nativos. Incluye certificado personalizado de impacto regenerativo."',
  '🌿 Eco-consciente': '"Cada producto de Enjambre Legado es trazable desde la colmena hasta tu mesa. Escaneá el QR y mirá el video de Cristina cosechando tu miel en Pureo, Chiloé. 22 años de apicultura regenerativa, 5.000 árboles plantados, cero huella negativa."',
};

export function VendedorView() {
  const [userProfile, setUserProfile] = useState<{ full_name?: string } | null>(null);
  const greeting = userProfile ? `¡Hola, ${userProfile.full_name || 'Representante'}!` : 'Cargando...';
  const title = 'Centro de Ventas y Ferias';
  const subtitle = 'Registra ventas, gestiona tus clientes y haz seguimiento de tu impacto en el territorio.';
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('productos').select('*').order('nombre');
      if (data?.length) setCatalogProducts(data.map((r: Record<string, unknown>) => mapProductoRow(r)));
    })();
  }, []);

  const products = catalogProducts;
  const totalStock = useMemo(() => products.reduce((sum, p) => sum + p.stock, 0), [products]);
  const [showFullCatalog, setShowFullCatalog] = useState(false);
  const [selectedPitch, setSelectedPitch] = useState('🏋️ Deportista');
  const [showQR, setShowQR] = useState(false);
  const [crmExpanded, setCrmExpanded] = useState(false);
  const [showPos, setShowPos] = useState(false);
  const [loadingPos, setLoadingPos] = useState(false);
  const [posMetodoPago, setPosMetodoPago] = useState<'efectivo' | 'transferencia' | 'tarjeta' | 'pos_terminal' | 'mixto'>('efectivo');
  const [posCart, setPosCart] = useState<Record<string, number>>({});
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClientForm, setNewClientForm] = useState({ name: '', type: 'Particular', purchases: 0, level: 'Guardián Bronce', lastOrder: 'Ninguna' });

  const [localClients, setLocalClients] = useState<{ name: string; type: string; purchases: number; level: string; lastOrder: string; id: string }[]>([]);
  const [ventasTotal, setVentasTotal] = useState(0);
  const [ventasTrend, setVentasTrend] = useState<string | undefined>();
  const [ferias, setFerias] = useState<FeriaItem[]>([]);
  const [qrLote, setQrLote] = useState<{ codigo: string; label: string; url: string } | null>(null);
  const apiFetch = useApiFetch();

  useEffect(() => {
    async function loadData() {
      const user = useAuthStore.getState().user;
      if (!user) return;

      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (prof) setUserProfile(prof);

      const [clientesRes, ventasRes, crmRes, qrRes, colmenaRes] = await Promise.all([
        supabase.from('clientes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('ventas').select('total, created_at, crm_cliente_id').eq('vendedor_id', user.id),
        apiFetch('/api/crm/dashboard'),
        supabase
          .from('qr_codes')
          .select('codigo, fecha_produccion, productos(nombre), lotes(nombre_lote)')
          .eq('activo', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from('colmenas').select('name, lote_activo').not('lote_activo', 'is', null).limit(1).maybeSingle(),
      ]);

      const tiendaBase = getUrlTienda().replace(/\/$/, '');
      if (qrRes.data) {
        const qr = qrRes.data as Record<string, unknown>;
        const producto = qr.productos as { nombre?: string } | null;
        const lote = qr.lotes as { nombre_lote?: string } | null;
        const codigo = String(qr.codigo);
        const label = [
          lote?.nombre_lote ? `Lote ${lote.nombre_lote}` : null,
          producto?.nombre,
          qr.fecha_produccion ? new Date(String(qr.fecha_produccion)).toLocaleDateString('es-CL') : null,
        ].filter(Boolean).join(' · ');
        setQrLote({
          codigo,
          label: label || `Código ${codigo}`,
          url: tiendaBase ? `${tiendaBase}/qr-scan?code=${encodeURIComponent(codigo)}` : codigo,
        });
      } else if (colmenaRes.data) {
        const c = colmenaRes.data as { name?: string; lote_activo?: string };
        setQrLote({
          codigo: String(c.lote_activo),
          label: `${c.lote_activo} · ${c.name ?? 'Colmena'}`,
          url: tiendaBase ? `${tiendaBase}/qr-scan?code=${encodeURIComponent(String(c.lote_activo))}` : String(c.lote_activo),
        });
      } else {
        setQrLote(null);
      }

      const purchaseCount = new Map<string, number>();
      (ventasRes.data ?? []).forEach((v: Record<string, unknown>) => {
        const cid = v.crm_cliente_id ? String(v.crm_cliente_id) : null;
        if (cid) purchaseCount.set(cid, (purchaseCount.get(cid) ?? 0) + 1);
      });

      if (clientesRes.data?.length) {
        setLocalClients(clientesRes.data.map((d: Record<string, unknown>) => {
          const id = String(d.id);
          const spent = Number(d.total_spent) || 0;
          const lastPurchase = d.last_purchase ? String(d.last_purchase) : null;
          return {
            id,
            name: String(d.name),
            type: String(d.type ?? 'D2C'),
            purchases: purchaseCount.get(id) ?? (spent > 0 ? 1 : 0),
            level: guardianLevel(spent),
            lastOrder: lastPurchase
              ? new Date(lastPurchase).toLocaleDateString('es-CL')
              : 'Sin compras',
          };
        }));
      } else {
        setLocalClients([]);
      }

      const ventasData = ventasRes.data ?? [];
      const total = ventasData.reduce((sum: number, v: Record<string, unknown>) => sum + (Number(v.total) || 0), 0);
      setVentasTotal(total);

      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      const prevMonth = thisMonth === 0 ? 11 : thisMonth - 1;
      const prevYear = thisMonth === 0 ? thisYear - 1 : thisYear;

      const monthTotal = (month: number, year: number) =>
        ventasData
          .filter((v: Record<string, unknown>) => {
            const d = new Date(String(v.created_at));
            return d.getMonth() === month && d.getFullYear() === year;
          })
          .reduce((s: number, v: Record<string, unknown>) => s + (Number(v.total) || 0), 0);

      const current = monthTotal(thisMonth, thisYear);
      const previous = monthTotal(prevMonth, prevYear);
      if (previous > 0 && current !== previous) {
        const pct = Math.round(((current - previous) / previous) * 100);
        setVentasTrend(pct >= 0 ? `+${pct}%` : `${pct}%`);
      } else if (current > 0) {
        setVentasTrend(`+$${Math.round(current / 1000)}K`);
      } else {
        setVentasTrend(undefined);
      }

      if (crmRes.ok) {
        const json = await crmRes.json() as { data: CRMDashboard };
        const dashboard = json.data;
        const assignmentMap = new Map(
          (dashboard.assignments ?? []).map((a) => [a.evento_id, a])
        );
        setFerias((dashboard.eventos ?? []).map((e) => {
          const assignment = assignmentMap.get(e.id);
          const meta = assignment?.meta_ventas ? Number(assignment.meta_ventas) : 0;
          return {
            id: e.id,
            name: e.nombre ?? 'Evento sin nombre',
            date: formatEventoDate(e.fecha_inicio, e.fecha_fin),
            estimated: meta > 0 ? `$${meta.toLocaleString('es-CL')}` : '—',
            status: feriaStatus(e.fecha_inicio),
          };
        }));
      } else {
        setFerias([]);
      }
    }
    loadData();
  }, [apiFetch]);

  const handleAddClient = async () => {
    if (!newClientForm.name) return;

    try {
      const user = useAuthStore.getState().user;
      if (user) {
        const { data } = await supabase.from('clientes').insert({
          name: newClientForm.name,
          type: mapClientType(newClientForm.type),
          user_id: user.id,
          status: 'activo'
        }).select().single();

        if (data) {
          setLocalClients([{ name: data.name, type: data.type, purchases: 0, level: 'Guardián Bronce', lastOrder: 'Ninguna', id: data.id }, ...localClients]);
        }
      }
    } catch (e) {
      toast(friendlyError(e, 'Error al agregar cliente'), { type: 'error' });
    }

    setShowAddClient(false);
    setNewClientForm({ name: '', type: 'Particular', purchases: 0, level: 'Guardián Bronce', lastOrder: 'Ninguna' });
  };

  const addToCart = (id: string, step: number = 1) => {
    setPosCart(prev => {
      const current = prev[id] || 0;
      const next = current + step;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: next };
    });
  };

  const cartTotal = Object.entries(posCart).reduce((sum, [id, qty]) => {
    const p = products.find(prod => prod.id === id);
    return sum + (p?.price || 0) * qty;
  }, 0);

  const cartItemsCount = Object.values(posCart).reduce((a, b) => a + b, 0);

  const displayedClients = crmExpanded ? localClients : localClients.slice(0, 4);

  const displayedProducts = showFullCatalog ? products : products.slice(0, 4);

  return (
    <div>
      <ImmersiveModal
        open={showQR}
        onClose={() => setShowQR(false)}
        eyebrow="Trazabilidad"
        title="QR de lote"
        size="md"
      >
        <div className="text-center">
          {qrLote ? (
            <QRCodeSvg value={qrLote.url} size={140} className="mx-auto mb-6 border-none p-2 bg-white rounded-sm" fgColor="#000000" />
          ) : (
            <QrCode size={120} className="text-foreground mx-auto mb-6 opacity-40" />
          )}
          <p className="text-[0.85rem] text-muted-foreground leading-relaxed">
            Escanea este código para ver la historia del lote: colmena, cosecha e impacto regenerativo.
          </p>
          <div className="mt-6 p-4 bg-accent/10 rounded-sm text-[0.82rem] text-accent font-medium">
            {qrLote ? qrLote.label : 'Sin lote activo — registra un QR o asigna lote_activo a una colmena'}
          </div>
        </div>
      </ImmersiveModal>

      <ImmersiveModal
        open={showPos}
        onClose={() => setShowPos(false)}
        eyebrow="Ventas en terreno"
        title="Modo Feria (POS offline)"
        size="full"
        bodyClassName="p-0"
      >
            <div className="flex h-full min-h-[60vh] flex-col overflow-hidden">
            <div className="px-6 py-3 bg-foreground text-primary-foreground flex items-center gap-3 shrink-0">
              <ShoppingBag size={20} />
              <span className="badge badge-success text-[0.65rem] bg-success/20">● Sincronización local</span>
            </div>
            <div className="flex flex-1 overflow-hidden min-h-0">
              <div className="flex-[2] border-r border-border overflow-y-auto p-6 bg-muted">
                <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
                  {products.map(p => (
                    <div key={p.id} className="bg-card p-4 rounded-sm border border-border shadow-sm flex flex-col" style={{ boxShadow: '0 2px 4px hsl(var(--foreground) / 0.02)' }}>
                      <div className="text-[2rem] text-center mb-2">{p.emoji}</div>
                      <div className="font-semibold text-[0.85rem] text-foreground leading-tight mb-1">{p.name}</div>
                      <div className="text-[0.9rem] text-accent font-bold mb-auto">${p.price.toLocaleString()}</div>
                      <div className="flex items-center justify-between mt-3 bg-muted/50 rounded-sm p-1">
                        <button onClick={() => addToCart(p.id, -1)} className="w-7 h-7 flex items-center justify-center bg-card rounded border border-border cursor-pointer"><Minus size={14} /></button>
                        <span className="font-semibold text-[0.9rem]">{posCart[p.id] || 0}</span>
                        <button onClick={() => addToCart(p.id, 1)} className="w-7 h-7 flex items-center justify-center bg-foreground text-primary-foreground rounded border-none cursor-pointer"><Plus size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-1 flex flex-col bg-card">
                <div className="p-4 border-b border-border font-semibold text-[0.95rem] text-foreground flex justify-between">
                  <span>Venta Actual</span>
                  <span className="text-muted-foreground">{cartItemsCount} items</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {Object.entries(posCart).length === 0 ? (
                    <div className="text-center text-muted-foreground text-[0.85rem] mt-10">Carrito vacío. Selecciona productos para comenzar.</div>
                  ) : (
                    Object.entries(posCart).map(([id, qty]) => {
                      const p = products.find(prod => prod.id === id);
                      if (!p) return null;
                      return (
                        <div key={id} className="flex justify-between items-center mb-3 text-[0.85rem]">
                          <div>
                            <div className="font-medium text-foreground">{p.name}</div>
                            <div className="text-muted-foreground">{qty} x ${p.price.toLocaleString()}</div>
                          </div>
                          <div className="font-semibold">${(p.price * qty).toLocaleString()}</div>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="p-6 border-t border-border bg-accent/[0.08]">
                  <div className="flex justify-between mb-2 text-[0.9rem] text-muted-foreground">
                    <span>Subtotal</span><span>${cartTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between mb-4 text-xl font-bold text-foreground">
                    <span>Total</span><span>${cartTotal.toLocaleString()}</span>
                  </div>
                  <label className="block text-xs text-muted-foreground mb-1">Método de pago</label>
                  <select
                    className="w-full mb-4 px-3 py-2 rounded-lg border border-border bg-card text-sm"
                    value={posMetodoPago}
                    onChange={(e) => setPosMetodoPago(e.target.value as typeof posMetodoPago)}
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="pos_terminal">POS Terminal</option>
                    <option value="mixto">Mixto</option>
                  </select>
                  <button className="btn btn-primary w-full py-3.5 text-base font-semibold" disabled={cartTotal === 0 || loadingPos} onClick={async () => {
                    setLoadingPos(true);
                    try {
                      const user = useAuthStore.getState().user;
                      if (user) {
                        const { error } = await supabase.from('ventas').insert({
                          vendedor_id: user.id,
                          total: Math.round(cartTotal),
                          items: posCart as unknown as Record<string, number>,
                          origen: 'feria',
                          metodo_pago: posMetodoPago,
                          estado: 'completada',
                          offline_synced: typeof navigator !== 'undefined' ? !navigator.onLine : false,
                        });
                        if (error) throw error;
                      }
                      toast(typeof navigator !== 'undefined' && !navigator.onLine
                        ? 'Venta guardada localmente; se sincronizará al recuperar conexión.'
                        : 'Venta registrada correctamente.', { type: 'success' });
                      setPosCart({});
                      setShowPos(false);
                    } catch (e) {
                      toast(friendlyError(e, 'No se pudo registrar la venta'), { type: 'error' });
                    } finally {
                      setLoadingPos(false);
                    }
                  }}>
                    Cobrar Venta
                  </button>
                </div>
              </div>
            </div>
          </div>
      </ImmersiveModal>

      <ViewShell
        greeting={greeting}
        title={title}
        subtitle={subtitle}
      />
      <div className="stats-grid">
        {[
          { icon: <ShoppingBag size={20} />, val: ventasTotal > 0 ? `$${(ventasTotal / 1000).toFixed(0)}K` : '0', label: 'Ventas temporada', trend: ventasTrend },
          { icon: <Users size={20} />, val: String(localClients.filter((c) => c.purchases > 0).length || localClients.length), label: 'Clientes activos' },
          { icon: <MapPin size={20} />, val: String(ferias.length), label: 'Ferias programadas' },
          { icon: <Truck size={20} />, val: totalStock.toLocaleString(), label: 'Unidades en stock' },
        ].map((s, i) => (
          <div key={i} className={`stat-card animate-in delay-${i + 1}`}>
            <div className="stat-header"><div className="stat-icon">{s.icon}</div>{s.trend && <span className="stat-trend up">{s.trend}</span>}</div>
            <div className="stat-value">{s.val}</div><div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="dashboard-grid dashboard-grid-2-1 mt-6">
        <div className="flex flex-col gap-6">
          <div className="card animate-in delay-2">
            <div className="section-header">
              <div><div className="section-title">Catálogo Vivo</div><div className="section-subtitle">Cada producto tiene historia y propósito regenerativo</div></div>
              <button className="btn btn-outline btn-sm" onClick={() => setShowQR(true)}><QrCode size={14} /> Generar QR</button>
            </div>
            {products.length === 0 && (
              <p className="text-center text-muted-foreground p-6 text-[0.9rem]">
                No hay productos disponibles todavía. Carga productos desde la tienda o sincroniza el catálogo.
              </p>
            )}
            <div className="product-grid">
              {displayedProducts.map(p => (
                <div key={p.id} className="product-card">
                  <div className="product-card-image"><span>{p.emoji}</span><span className="product-card-badge badge badge-gold">{p.category}</span></div>
                  <div className="product-card-body">
                    <div className="product-card-name">{p.name}</div>
                    <div className="product-card-description">{p.description}</div>
                    <div className="product-card-footer"><span className="product-card-price">${p.price.toLocaleString()}</span><span className="product-card-impact">🌳 {p.impactTrees} árboles</span></div>
                    <div className="text-[0.72rem] text-muted-foreground mt-2">Stock: {p.stock} · {p.format}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-6">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowFullCatalog(!showFullCatalog)}>
                {showFullCatalog ? 'Ver menos' : `Ver catálogo completo (${products.length} productos)`} <ChevronDown size={14} style={{ transform: showFullCatalog ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
              </button>
            </div>
          </div>
          <div className="card animate-in delay-3">
            <div className="section-header">
              <div><div className="section-title">Guardianes del Legado (CRM)</div><div className="section-subtitle">Clientes transformados en embajadores</div></div>
              <div className="flex gap-2">
                <button className="btn btn-gold btn-sm" onClick={() => setShowAddClient(true)}><Plus size={14} style={{ marginRight: 4 }} /> Cliente</button>
                <button className="btn btn-outline btn-sm" onClick={() => setCrmExpanded(!crmExpanded)}>{crmExpanded ? 'Ver menos' : 'Ver CRM'}</button>
              </div>
            </div>

            <table className="data-table"><thead><tr><th>Cliente</th><th>Tipo</th><th>Compras</th><th>Nivel</th><th>Última orden</th></tr></thead><tbody>{displayedClients.map((c, i) => (<tr key={i}><td className="font-medium text-foreground">{c.name}</td><td><span className="badge badge-gold">{c.type}</span></td><td>{c.purchases}</td><td><span className="flex items-center gap-1"><Star size={12} className="text-accent" />{c.level}</span></td><td className="text-muted-foreground text-[0.82rem]">{c.lastOrder}</td></tr>))}</tbody></table>
            {!crmExpanded && localClients.length > 4 && <div className="text-center mt-4 text-[0.75rem] text-muted-foreground">+{localClients.length - 4} clientes más</div>}
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <div className="card animate-in delay-3">
            <div className="section-header"><div className="section-title flex items-center gap-2"><CalendarDays size={18} /> Próximas Ferias</div></div>
            {ferias.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-6">Sin ferias programadas. Configúralas desde CRM → Agenda Ferias.</p>
            )}
            {ferias.map((f, i) => (
              <div key={f.id} className={`p-4 rounded-sm mb-2 ${i === 0 ? 'bg-accent/10 border border-accent/25' : 'bg-transparent border border-transparent'}`}>
                <div className="flex justify-between items-center"><strong className="text-[0.9rem] text-foreground">{f.name}</strong><span className={`badge ${f.status === 'Confirmada' || f.status === 'En curso' ? 'badge-success' : f.status === 'Programada' ? 'badge-gold' : 'badge-warning'}`}>{f.status}</span></div>
                <div className="text-[0.78rem] text-muted-foreground mt-1">📅 {f.date} · Meta: {f.estimated}</div>
              </div>
            ))}
          </div>
          <div className="card animate-in delay-4">
            <div className="section-title text-base mb-4">🎯 Generador de Pitch</div>
            <div className="text-[0.82rem] text-muted-foreground mb-4">Selecciona el tipo de cliente:</div>
            <div className="flex flex-wrap gap-2">
              {Object.keys(pitches).map(type => (
                <button key={type} className={`btn btn-sm ${selectedPitch === type ? 'btn-gold' : 'btn-outline'} text-[0.78rem]`} onClick={() => setSelectedPitch(type)}>{type}</button>
              ))}
            </div>
            <div className="mt-6 p-4 bg-muted/50 rounded-sm text-[0.85rem] leading-relaxed italic text-muted-foreground border-l-[3px] border-l-accent">
              {pitches[selectedPitch]}
            </div>
          </div>
          <div className="card animate-in delay-5">
            <div className="section-title text-base mb-4">Acciones rápidas</div>
            {[
              { label: 'Modo Feria (POS offline)', icon: <ShoppingBag size={16} />, desc: 'Cobro QR sin conexión', action: () => setShowPos(true) },
              { label: 'Ruta óptima del día', icon: <MapPin size={16} />, desc: 'En desarrollo', action: () => {} },
              { label: 'Generar etiquetas QR', icon: <QrCode size={16} />, desc: qrLote ? `Lote: ${qrLote.codigo}` : 'Sin lote activo', action: () => setShowQR(true) },
              { label: 'Reporte de ventas', icon: <TrendingUp size={16} />, desc: 'En desarrollo', action: () => {} },
            ].map((action, i) => (
              <button key={i} className="btn btn-ghost w-full justify-between p-4 mb-1 text-left" onClick={action.action}>
                <span className="flex items-center gap-2">{action.icon}<span><span className="block">{action.label}</span><span className="block text-[0.7rem] text-muted-foreground font-normal">{action.desc}</span></span></span>
                <ArrowUpRight size={14} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <ImmersiveModal
        open={showAddClient}
        onClose={() => setShowAddClient(false)}
        eyebrow="CRM"
        title="Registrar nuevo guardián"
        size="md"
        footer={
          <>
            <button className="btn btn-outline btn-sm" onClick={() => setShowAddClient(false)}>Cancelar</button>
            <button className="btn btn-primary btn-sm" onClick={handleAddClient}>Guardar cliente</button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input autoFocus type="text" placeholder="Nombre / Organización" className="input-field" value={newClientForm.name} onChange={e => setNewClientForm({ ...newClientForm, name: e.target.value })} />
          <select className="input-field" value={newClientForm.type} onChange={e => setNewClientForm({ ...newClientForm, type: e.target.value })}>
            <option value="Particular">Particular</option>
            <option value="Chef">Chef / Restorant</option>
            <option value="Reseller">Reseller / Tienda</option>
            <option value="Deportivo">Centro Deportivo</option>
          </select>
        </div>
      </ImmersiveModal>
    </div>
  );
}
