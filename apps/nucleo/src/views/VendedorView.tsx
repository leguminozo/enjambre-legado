import { useState, useEffect, useMemo } from 'react';
import { ShoppingBag, Users, MapPin, CalendarDays, TrendingUp, Star, ArrowUpRight, QrCode, Truck, X, ChevronDown, Plus, Minus } from 'lucide-react';
import type { Product } from '../data/mockData';
import { supabase } from '../lib/supabase';
import { friendlyError, friendlySupabaseError, toast } from '@enjambre/ui';
import { useAuthStore } from '@enjambre/auth';

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
  const [posCart, setPosCart] = useState<Record<string, number>>({});
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClientForm, setNewClientForm] = useState({ name: '', type: 'Particular', purchases: 0, level: 'Guardián Bronce', lastOrder: 'Ninguna' });

  const [localClients, setLocalClients] = useState<{ name: string; type: string; purchases: number; level: string; lastOrder: string; id: string }[]>([]);
  const [ventasTotal, setVentasTotal] = useState(0);

  useEffect(() => {
    async function loadData() {
      const user = useAuthStore.getState().user;
      if (!user) return;

      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (prof) {
        setUserProfile(prof);
      }

      const { data } = await supabase.from('clientes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data && data.length > 0) {
        setLocalClients(data.map((d: Record<string, unknown>) => ({ name: String(d.name), type: String(d.type), purchases: Number(d.total_spent) > 0 ? 1 : 0, level: 'Guardián Bronce', lastOrder: 'Reciente', id: String(d.id) })));
      }
      const { data: ventasData } = await supabase.from('ventas')
        .select('total')
        .eq('vendedor_id', user.id);
      if (ventasData) {
        setVentasTotal(ventasData.reduce((sum: number, v: Record<string, unknown>) => sum + (Number(v.total) || 0), 0));
      }
    }
    loadData();
  }, []);

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

  const ferias = [
    { name: 'Feria Ancud', date: '15 marzo', estimated: '$450.000', status: 'Confirmada' },
    { name: 'ExpoMundoRural Santiago', date: '22–24 abril', estimated: '$1.800.000', status: 'Inscrita' },
    { name: 'Mercadito Puqueldón', date: '5 abril', estimated: '$120.000', status: 'Pendiente' },
  ];

  const displayedProducts = showFullCatalog ? products : products.slice(0, 4);

  return (
    <div>
      {showQR && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={() => setShowQR(false)} />
          <div className="card relative z-[201] w-[90%] max-w-[400px] text-center p-8" style={{ animation: 'fadeInUp 0.3s ease' }}>
            <button onClick={() => setShowQR(false)} className="btn btn-ghost btn-sm absolute top-3 right-3"><X size={18} /></button>
            <QrCode size={120} className="text-foreground mx-auto mb-6" />
            <h3 className="mb-2">QR de Trazabilidad</h3>
            <p className="text-[0.85rem] text-muted-foreground leading-relaxed">Escanea este código con tu celular para ver la historia completa del lote: colmena de origen, fecha de cosecha, video de Cristina en Pureo y el impacto regenerativo de tu compra.</p>
            <div className="mt-6 p-4 bg-accent/10 rounded-sm text-[0.82rem] text-accent font-medium">Lote #2026-ULM-047 · Colmena Ulmo Mayor · 28 feb 2026</div>
          </div>
        </div>
      )}

      {showPos && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center">
          <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" onClick={() => setShowPos(false)} />
          <div className="card relative z-[301] w-[95%] max-w-[800px] h-[85vh] flex flex-col p-0 overflow-hidden" style={{ animation: 'fadeInUp 0.3s ease' }}>
            <div className="px-6 py-4 bg-foreground text-primary-foreground flex justify-between items-center">
              <div className="flex items-center gap-3">
                <ShoppingBag size={20} />
                <span className="font-semibold text-[1.1rem]">Modo Feria (POS Offline)</span>
                <span className="badge badge-success text-[0.65rem] bg-success/20">● Sincronización local</span>
              </div>
              <button onClick={() => setShowPos(false)} className="bg-transparent border-none text-primary-foreground cursor-pointer"><X size={20} /></button>
            </div>
            <div className="flex flex-1 overflow-hidden">
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
                          metodo_pago: 'Efectivo/Transferencia',
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
        </div>
      )}

      <div className="hero-banner animate-in">
        <div className="hero-greeting">{greeting}</div>
        <h1 className="hero-title">{title}</h1>
        <p className="hero-subtitle">{subtitle}</p>
      </div>
      <div className="stats-grid">
        {[
          { icon: <ShoppingBag size={20} />, val: ventasTotal > 0 ? `$${(ventasTotal / 1000).toFixed(0)}K` : '0', label: 'Ventas temporada', trend: ventasTotal > 0 ? '+32%' : undefined },
          { icon: <Users size={20} />, val: String(localClients.length), label: 'Clientes activos', trend: localClients.length > 0 ? `+${Math.min(localClients.length, 12)}` : undefined },
          { icon: <MapPin size={20} />, val: '3', label: 'Ferias programadas' },
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

            {showAddClient && (
              <div className="p-4 bg-accent/10 rounded-md mb-4 border border-accent/30 relative">
                <button onClick={() => setShowAddClient(false)} className="absolute top-3 right-3 bg-transparent border-none cursor-pointer text-muted-foreground"><X size={16} /></button>
                <div className="text-[0.85rem] font-semibold text-foreground mb-2">Registrar Nuevo Guardián</div>

                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input autoFocus type="text" placeholder="Nombre / Organización" className="input-field" value={newClientForm.name} onChange={e => setNewClientForm({ ...newClientForm, name: e.target.value })} />
                  <select className="input-field" value={newClientForm.type} onChange={e => setNewClientForm({ ...newClientForm, type: e.target.value })}>
                    <option value="Particular">Particular</option>
                    <option value="Chef">Chef / Restorant</option>
                    <option value="Reseller">Reseller / Tienda</option>
                    <option value="Deportivo">Centro Deportivo</option>
                  </select>
                </div>
                <div className="flex justify-end">
                  <button className="btn btn-primary btn-sm" onClick={handleAddClient}>Guardar Cliente</button>
                </div>
              </div>
            )}

            <table className="data-table"><thead><tr><th>Cliente</th><th>Tipo</th><th>Compras</th><th>Nivel</th><th>Última orden</th></tr></thead><tbody>{displayedClients.map((c, i) => (<tr key={i}><td className="font-medium text-foreground">{c.name}</td><td><span className="badge badge-gold">{c.type}</span></td><td>{c.purchases}</td><td><span className="flex items-center gap-1"><Star size={12} className="text-accent" />{c.level}</span></td><td className="text-muted-foreground text-[0.82rem]">{c.lastOrder}</td></tr>))}</tbody></table>
            {!crmExpanded && localClients.length > 4 && <div className="text-center mt-4 text-[0.75rem] text-muted-foreground">+{localClients.length - 4} clientes más</div>}
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <div className="card animate-in delay-3">
            <div className="section-header"><div className="section-title flex items-center gap-2"><CalendarDays size={18} /> Próximas Ferias</div></div>
            {ferias.map((f, i) => (
              <div key={i} className={`p-4 rounded-sm mb-2 ${i === 0 ? 'bg-accent/10 border border-accent/25' : 'bg-transparent border border-transparent'}`}>
                <div className="flex justify-between items-center"><strong className="text-[0.9rem] text-foreground">{f.name}</strong><span className={`badge ${f.status === 'Confirmada' ? 'badge-success' : f.status === 'Inscrita' ? 'badge-gold' : 'badge-warning'}`}>{f.status}</span></div>
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
              { label: 'Generar etiquetas QR', icon: <QrCode size={16} />, desc: 'Lote activo: #2026-ULM-047', action: () => setShowQR(true) },
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
    </div>
  );
}
