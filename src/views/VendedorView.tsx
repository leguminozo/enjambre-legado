import { useState } from 'react';
import { ShoppingBag, Users, MapPin, CalendarDays, TrendingUp, Star, ArrowUpRight, ChevronRight, QrCode, Truck, X, ChevronDown } from 'lucide-react';
import { products, roleGreetings } from '../data/mockData';

const pitches: Record<string, string> = {
    '🏋️ Deportista': '"Cada sachet de Gotas de Néctar es una dosis de 15g de energía pura del bosque patagónico. Ideal para pre o post entreno. Sin azúcar añadida, cargada de antioxidantes. Y con cada sachet, plantas 0.3 árboles nativos en Chiloé."',
    '👨‍🍳 Chef': '"El panal natural completo es una experiencia gastronómica que tus comensales no olvidarán. Textura, aroma y sabor del bosque de ulmo directo a la mesa. Ideal para tablas, postres y maridaje con quesos de Chiloé. Cada panal regenera 3 árboles nativos."',
    '🏪 Tienda': '"Nuestros sachets son el formato con mayor rotación: margen 72%, presentación premium, storytelling regenerativo que fideliza. Incluimos material POP y QR de trazabilidad. Condiciones especiales para resellers desde 50 unidades."',
    '🎁 Regalo': '"El Cofre Legado del Bosque es un regalo que trasciende: miel virgen + crema artesanal + sachets + hidrolato. Cada cofre planta 5 árboles nativos. Incluye certificado personalizado de impacto regenerativo."',
    '🌿 Eco-consciente': '"Cada producto de Enjambre Legado es trazable desde la colmena hasta tu mesa. Escaneá el QR y mirá el video de Cristina cosechando tu miel en Pureo, Chiloé. 22 años de apicultura regenerativa, 5.000 árboles plantados, cero huella negativa."',
};

export default function VendedorView() {
    const { greeting, title, subtitle } = roleGreetings.vendedor;
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    const [showFullCatalog, setShowFullCatalog] = useState(false);
    const [selectedPitch, setSelectedPitch] = useState('🏋️ Deportista');
    const [showQR, setShowQR] = useState(false);
    const [crmExpanded, setCrmExpanded] = useState(false);

    const topClients = [
        { name: 'Restaurante Fogón Chiloé', type: 'Chef', purchases: 24, level: 'Guardián Oro', lastOrder: 'Panal + Cofre' },
        { name: 'Gimnasio Peak Performance', type: 'Deportivo', purchases: 180, level: 'Guardián Plata', lastOrder: 'Sachets x100' },
        { name: 'Tienda Gourmet Castro', type: 'Reseller', purchases: 540, level: 'Guardián Oro', lastOrder: 'Mix completo' },
        { name: 'María Elena Pérez', type: 'Particular', purchases: 8, level: 'Guardián Bronce', lastOrder: 'Crema Cacao' },
        { name: 'Café Literario Ancud', type: 'Chef', purchases: 36, level: 'Guardián Plata', lastOrder: 'Panal x6' },
        { name: 'Deli Natural Santiago', type: 'Reseller', purchases: 320, level: 'Guardián Oro', lastOrder: 'Sachets x200' },
    ];
    const displayedClients = crmExpanded ? topClients : topClients.slice(0, 4);

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
                            <div><div className="section-title">Guardianes del Legado</div><div className="section-subtitle">Clientes transformados en embajadores</div></div>
                            <button className="btn btn-outline btn-sm" onClick={() => setCrmExpanded(!crmExpanded)}>{crmExpanded ? 'Ver menos' : 'Ver CRM'}</button>
                        </div>
                        <table className="data-table"><thead><tr><th>Cliente</th><th>Tipo</th><th>Compras</th><th>Nivel</th><th>Última orden</th></tr></thead>
                            <tbody>{displayedClients.map((c, i) => (<tr key={i}><td style={{ fontWeight: 500, color: 'var(--bosque-ulmo)' }}>{c.name}</td><td><span className="badge badge-gold">{c.type}</span></td><td>{c.purchases}</td><td><span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Star size={12} style={{ color: 'var(--oro-miel)' }} />{c.level}</span></td><td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{c.lastOrder}</td></tr>))}</tbody></table>
                        {!crmExpanded && topClients.length > 4 && <div style={{ textAlign: 'center', marginTop: 'var(--space-md)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>+{topClients.length - 4} clientes más</div>}
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
                            { label: 'Modo Feria (POS offline)', icon: <ShoppingBag size={16} />, desc: 'Cobro QR sin conexión' },
                            { label: 'Ruta óptima del día', icon: <MapPin size={16} />, desc: '3 paradas · 42 km' },
                            { label: 'Generar etiquetas QR', icon: <QrCode size={16} />, desc: 'Lote activo: #2026-ULM-047' },
                            { label: 'Reporte de ventas', icon: <TrendingUp size={16} />, desc: 'Febrero 2026' },
                        ].map((action, i) => (
                            <button key={i} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'space-between', padding: 'var(--space-md)', marginBottom: 'var(--space-xs)', textAlign: 'left' }}>
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
