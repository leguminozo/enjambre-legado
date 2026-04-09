import { useState, useEffect, useMemo } from 'react';
import { ShoppingBag, Users, MapPin, CalendarDays, TrendingUp, Star, ArrowUpRight, QrCode, Truck, X, ChevronDown, Plus, Minus } from 'lucide-react';
import { roleGreetings, type Product } from '../data/mockData';
import { supabase } from '../lib/supabase';

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
        category: String(p.formato ?? 'Legado'),
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

export default function VendedorView() {
    const { greeting, title, subtitle } = roleGreetings.vendedor;
    const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);

    useEffect(() => {
        (async () => {
            const { data } = await supabase.from('productos').select('*').order('nombre');
            if (data?.length) setCatalogProducts(data.map((r) => mapProductoRow(r as Record<string, unknown>)));
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

    const [localClients, setLocalClients] = useState<any[]>([]);

    useEffect(() => {
        async function loadData() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data } = await supabase.from('clientes')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false });
            if (data && data.length > 0) {
                setLocalClients(data.map(d => ({ name: d.name, type: d.type, purchases: d.total_spent > 0 ? 1 : 0, level: 'Guardián Bronce', lastOrder: 'Reciente', id: d.id })));
            }
        }
        loadData();
    }, []);

    const handleAddClient = async () => {
        if (!newClientForm.name) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data } = await supabase.from('clientes').insert({
                    name: newClientForm.name,
                    type: mapClientType(newClientForm.type),
                    user_id: session.user.id,
                    status: 'activo'
                }).select().single();

                if (data) {
                    setLocalClients([{ name: data.name, type: data.type, purchases: 0, level: 'Guardián Bronce', lastOrder: 'Ninguna', id: data.id }, ...localClients]);
                }
            }
        } catch (e) {
            console.error("Error adding client", e);
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
            {/* QR Modal */}
            {showQR && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }} onClick={() => setShowQR(false)} />
                    <div className="card" style={{ position: 'relative', zIndex: 201, width: '90%', maxWidth: 400, textAlign: 'center', padding: 'var(--space-xl)', animation: 'fadeInUp 0.3s ease' }}>
                        <button onClick={() => setShowQR(false)} className="btn btn-ghost btn-sm" style={{ position: 'absolute', top: 12, right: 12 }}><X size={18} /></button>
                        <QrCode size={120} style={{ color: 'var(--bosque-ulmo)', margin: '0 auto var(--space-lg)' }} />
                        <h3 style={{ marginBottom: 'var(--space-sm)' }}>QR de Trazabilidad</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>Escanea este código con tu celular para ver la historia completa del lote: colmena de origen, fecha de cosecha, video de Cristina en Pureo y el impacto regenerativo de tu compra.</p>
                        <div style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-md)', background: 'var(--oro-miel-glow)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'var(--oro-miel-dark)', fontWeight: 500 }}>Lote #2026-ULM-047 · Colmena Ulmo Mayor · 28 feb 2026</div>
                    </div>
                </div>
            )}

            {/* POS Modal */}
            {showPos && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }} onClick={() => setShowPos(false)} />
                    <div className="card" style={{ position: 'relative', zIndex: 301, width: '95%', maxWidth: 800, height: '85vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', animation: 'fadeInUp 0.3s ease' }}>
                        <div style={{ padding: 'var(--space-md) var(--space-lg)', background: 'var(--bosque-ulmo)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <ShoppingBag size={20} />
                                <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>Modo Feria (POS Offline)</span>
                                <span className="badge badge-success" style={{ fontSize: '0.65rem', background: 'rgba(46,204,113,0.2)' }}>● Offline Sync</span>
                            </div>
                            <button onClick={() => setShowPos(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                            {/* Product List */}
                            <div style={{ flex: 2, borderRight: '1px solid rgba(10,61,47,0.1)', overflowY: 'auto', padding: 'var(--space-lg)', background: '#FAFAFA' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-md)' }}>
                                    {products.map(p => (
                                        <div key={p.id} style={{ background: 'white', padding: 'var(--space-md)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(10,61,47,0.08)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
                                            <div style={{ fontSize: '2rem', textAlign: 'center', marginBottom: 8 }}>{p.emoji}</div>
                                            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--bosque-ulmo)', lineHeight: 1.3, marginBottom: 4 }}>{p.name}</div>
                                            <div style={{ fontSize: '0.9rem', color: 'var(--oro-miel-dark)', fontWeight: 700, marginBottom: 'auto' }}>${p.price.toLocaleString()}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, background: 'rgba(10,61,47,0.04)', borderRadius: 'var(--radius-sm)', padding: 4 }}>
                                                <button onClick={() => addToCart(p.id, -1)} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', borderRadius: 4, border: '1px solid rgba(10,61,47,0.1)', cursor: 'pointer' }}><Minus size={14} /></button>
                                                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{posCart[p.id] || 0}</span>
                                                <button onClick={() => addToCart(p.id, 1)} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bosque-ulmo)', color: 'white', borderRadius: 4, border: 'none', cursor: 'pointer' }}><Plus size={14} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* Cart Sidebar */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white' }}>
                                <div style={{ padding: 'var(--space-md)', borderBottom: '1px solid rgba(10,61,47,0.1)', fontWeight: 600, fontSize: '0.95rem', color: 'var(--bosque-ulmo)', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Venta Actual</span>
                                    <span style={{ color: 'var(--text-muted)' }}>{cartItemsCount} items</span>
                                </div>
                                <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-md)' }}>
                                    {Object.entries(posCart).length === 0 ? (
                                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 40 }}>Carrito vacío. Selecciona productos para comenzar.</div>
                                    ) : (
                                        Object.entries(posCart).map(([id, qty]) => {
                                            const p = products.find(prod => prod.id === id);
                                            if (!p) return null;
                                            return (
                                                <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, fontSize: '0.85rem' }}>
                                                    <div>
                                                        <div style={{ fontWeight: 500, color: 'var(--bosque-ulmo)' }}>{p.name}</div>
                                                        <div style={{ color: 'var(--text-muted)' }}>{qty} x ${p.price.toLocaleString()}</div>
                                                    </div>
                                                    <div style={{ fontWeight: 600 }}>${(p.price * qty).toLocaleString()}</div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                                <div style={{ padding: 'var(--space-lg)', borderTop: '1px solid rgba(10,61,47,0.1)', background: 'rgba(212,160,23,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                        <span>Subtotal</span><span>${cartTotal.toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-md)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--bosque-ulmo)' }}>
                                        <span>Total</span><span>${cartTotal.toLocaleString()}</span>
                                    </div>
                                    <button className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: 600 }} disabled={cartTotal === 0 || loadingPos} onClick={async () => {
                                        setLoadingPos(true);
                                        try {
                                            const { data: { session } } = await supabase.auth.getSession();
                                            if (session) {
                                                const { error } = await supabase.from('ventas').insert({
                                                    vendedor_id: session.user.id,
                                                    total: Math.round(cartTotal),
                                                    items: posCart as unknown as Record<string, number>,
                                                    origen: 'feria',
                                                    metodo_pago: 'Efectivo/Transferencia',
                                                    estado: 'completada',
                                                    offline_synced: typeof navigator !== 'undefined' ? !navigator.onLine : false,
                                                });
                                                if (error) throw error;
                                            }
                                            alert(typeof navigator !== 'undefined' && !navigator.onLine
                                                ? 'Venta guardada localmente; se sincronizará al recuperar red.'
                                                : 'Venta registrada correctamente.');
                                            setPosCart({});
                                            setShowPos(false);
                                        } catch (e) {
                                            console.error('Error POS:', e);
                                            alert('No se pudo registrar la venta. Revisa conexión o permisos.');
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
                    { icon: <ShoppingBag size={20} />, val: '$2.4M', label: 'Ventas temporada', trend: '+32%' },
                    { icon: <Users size={20} />, val: '87', label: 'Clientes activos', trend: '+12' },
                    { icon: <MapPin size={20} />, val: '3', label: 'Ferias programadas' },
                    { icon: <Truck size={20} />, val: totalStock.toLocaleString(), label: 'Unidades en stock' },
                ].map((s, i) => (
                    <div key={i} className={`stat-card animate-in delay-${i + 1}`}>
                        <div className="stat-header"><div className="stat-icon">{s.icon}</div>{s.trend && <span className="stat-trend up">{s.trend}</span>}</div>
                        <div className="stat-value">{s.val}</div><div className="stat-label">{s.label}</div>
                    </div>
                ))}
            </div>
            <div className="dashboard-grid dashboard-grid-2-1" style={{ marginTop: 'var(--space-lg)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                    <div className="card animate-in delay-2">
                        <div className="section-header">
                            <div><div className="section-title">Catálogo Vivo</div><div className="section-subtitle">Cada producto tiene historia y propósito regenerativo</div></div>
                            <button className="btn btn-outline btn-sm" onClick={() => setShowQR(true)}><QrCode size={14} /> Generar QR</button>
                        </div>
                        {products.length === 0 && (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-lg)', fontSize: '0.9rem' }}>
                                No hay productos en Supabase todavía. Carga filas en la tabla <code>productos</code> o sincroniza desde la tienda.
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
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 'var(--space-sm)' }}>Stock: {p.stock} · {p.format}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={{ textAlign: 'center', marginTop: 'var(--space-lg)' }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowFullCatalog(!showFullCatalog)}>
                                {showFullCatalog ? 'Ver menos' : `Ver catálogo completo (${products.length} productos)`} <ChevronDown size={14} style={{ transform: showFullCatalog ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
                            </button>
                        </div>
                    </div>
                    <div className="card animate-in delay-3">
                        <div className="section-header">
                            <div><div className="section-title">Guardianes del Legado (CRM)</div><div className="section-subtitle">Clientes transformados en embajadores</div></div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="btn btn-gold btn-sm" onClick={() => setShowAddClient(true)}><Plus size={14} style={{ marginRight: 4 }} /> Cliente</button>
                                <button className="btn btn-outline btn-sm" onClick={() => setCrmExpanded(!crmExpanded)}>{crmExpanded ? 'Ver menos' : 'Ver CRM'}</button>
                            </div>
                        </div>

                        {showAddClient && (
                            <div style={{ padding: 'var(--space-md)', background: 'var(--oro-miel-glow)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)', border: '1px solid rgba(212,160,23,0.3)', position: 'relative' }}>
                                <button onClick={() => setShowAddClient(false)} style={{ position: 'absolute', top: 12, right: 12, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={16} /></button>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--bosque-ulmo)', marginBottom: 'var(--space-sm)' }}>Registrar Nuevo Guardián</div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                                    <input autoFocus type="text" placeholder="Nombre / Organización" className="input-field" value={newClientForm.name} onChange={e => setNewClientForm({ ...newClientForm, name: e.target.value })} />
                                    <select className="input-field" value={newClientForm.type} onChange={e => setNewClientForm({ ...newClientForm, type: e.target.value })}>
                                        <option value="Particular">Particular</option>
                                        <option value="Chef">Chef / Restorant</option>
                                        <option value="Reseller">Reseller / Tienda</option>
                                        <option value="Deportivo">Centro Deportivo</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <button className="btn btn-primary btn-sm" onClick={handleAddClient}>Guardar Cliente</button>
                                </div>
                            </div>
                        )}

                        <table className="data-table"><thead><tr><th>Cliente</th><th>Tipo</th><th>Compras</th><th>Nivel</th><th>Última orden</th></tr></thead>
                            <tbody>{displayedClients.map((c, i) => (<tr key={i}><td style={{ fontWeight: 500, color: 'var(--bosque-ulmo)' }}>{c.name}</td><td><span className="badge badge-gold">{c.type}</span></td><td>{c.purchases}</td><td><span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Star size={12} style={{ color: 'var(--oro-miel)' }} />{c.level}</span></td><td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{c.lastOrder}</td></tr>))}</tbody></table>
                        {!crmExpanded && localClients.length > 4 && <div style={{ textAlign: 'center', marginTop: 'var(--space-md)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>+{localClients.length - 4} clientes más</div>}
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                    <div className="card animate-in delay-3">
                        <div className="section-header"><div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><CalendarDays size={18} /> Próximas Ferias</div></div>
                        {ferias.map((f, i) => (
                            <div key={i} style={{ padding: 'var(--space-md)', borderRadius: 'var(--radius-sm)', background: i === 0 ? 'var(--oro-miel-glow)' : 'transparent', marginBottom: 'var(--space-sm)', border: i === 0 ? '1px solid rgba(212,160,23,0.2)' : '1px solid transparent' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><strong style={{ fontSize: '0.9rem', color: 'var(--bosque-ulmo)' }}>{f.name}</strong><span className={`badge ${f.status === 'Confirmada' ? 'badge-success' : f.status === 'Inscrita' ? 'badge-gold' : 'badge-warning'}`}>{f.status}</span></div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>📅 {f.date} · Meta: {f.estimated}</div>
                            </div>
                        ))}
                    </div>
                    <div className="card animate-in delay-4">
                        <div className="section-title" style={{ fontSize: '1rem', marginBottom: 'var(--space-md)' }}>🎯 Generador de Pitch</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>Selecciona el tipo de cliente:</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                            {Object.keys(pitches).map(type => (
                                <button key={type} className={`btn btn-sm ${selectedPitch === type ? 'btn-gold' : 'btn-outline'}`} style={{ fontSize: '0.78rem' }} onClick={() => setSelectedPitch(type)}>{type}</button>
                            ))}
                        </div>
                        <div style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-md)', background: 'rgba(10,61,47,0.04)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', lineHeight: 1.7, fontStyle: 'italic', color: 'var(--text-secondary)', borderLeft: '3px solid var(--oro-miel)' }}>
                            {pitches[selectedPitch]}
                        </div>
                    </div>
                    <div className="card animate-in delay-5">
                        <div className="section-title" style={{ fontSize: '1rem', marginBottom: 'var(--space-md)' }}>Acciones rápidas</div>
                        {[
                            { label: 'Modo Feria (POS offline)', icon: <ShoppingBag size={16} />, desc: 'Cobro QR sin conexión', action: () => setShowPos(true) },
                            { label: 'Ruta óptima del día', icon: <MapPin size={16} />, desc: '3 paradas · 42 km', action: () => alert('Mapa de ruta en desarrollo...') },
                            { label: 'Generar etiquetas QR', icon: <QrCode size={16} />, desc: 'Lote activo: #2026-ULM-047', action: () => setShowQR(true) },
                            { label: 'Reporte de ventas', icon: <TrendingUp size={16} />, desc: 'Febrero 2026', action: () => alert('Descargando reporte Csv/PDF...') },
                        ].map((action, i) => (
                            <button key={i} className="btn btn-ghost" onClick={action.action} style={{ width: '100%', justifyContent: 'space-between', padding: 'var(--space-md)', marginBottom: 'var(--space-xs)', textAlign: 'left' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{action.icon}<span><span style={{ display: 'block' }}>{action.label}</span><span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>{action.desc}</span></span></span>
                                <ArrowUpRight size={14} />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
