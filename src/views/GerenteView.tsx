import { useState } from 'react';
import { BarChart3, TrendingUp, DollarSign, Target, Leaf, Crown, ArrowUpRight, Expand, Minimize2, Plus, X } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { roleGreetings } from '../data/mockData';

const productionData = [
    { month: 'Ene', actual: 180, projected: 200 }, { month: 'Feb', actual: 320, projected: 300 },
    { month: 'Mar', actual: 280, projected: 350 }, { month: 'Abr', actual: 0, projected: 400 },
    { month: 'May', actual: 0, projected: 250 }, { month: 'Jun', actual: 0, projected: 100 },
    { month: 'Jul', actual: 0, projected: 50 }, { month: 'Ago', actual: 0, projected: 80 },
    { month: 'Sep', actual: 0, projected: 150 }, { month: 'Oct', actual: 0, projected: 280 },
    { month: 'Nov', actual: 0, projected: 380 }, { month: 'Dic', actual: 0, projected: 450 },
];
const revenueByProduct = [
    { product: 'Sachets', revenue: 960, margin: 72 }, { product: 'Cremas', revenue: 680, margin: 58 },
    { product: 'Miel pura', revenue: 540, margin: 65 }, { product: 'Panal', revenue: 320, margin: 71 },
    { product: 'Cofres', revenue: 420, margin: 55 }, { product: 'Mezclas', revenue: 280, margin: 62 },
];
const cashFlowData = [
    { month: 'Ene', income: 450, expenses: 280 }, { month: 'Feb', income: 620, expenses: 310 },
    { month: 'Mar', income: 580, expenses: 290 }, { month: 'Abr', income: 480, expenses: 350 },
    { month: 'May', income: 320, expenses: 280 }, { month: 'Jun', income: 180, expenses: 250 },
];

const aiResponses: Record<string, string> = {
    'sachet': 'Con los datos actuales, el lote de sachets con cacao nibs debería salir en 18 días. Hay demanda en La Reina (Santiago) para 400 unidades. Sugiero priorizar cosecha de Ulmo Mayor.',
    'ancud': 'La expansión a Ancud muestra un ROI proyectado de 14 meses vs 22 meses para Santiago. El terreno evaluado tiene acceso a floración de ulmo + tiaque. Recomendación: abrir apiario en Q3 2026.',
    'margen': 'Los sachets (72%) y panales (71%) son los formatos con mejor margen. Las cremas (58%) tienen menor margen pero mayor ticket promedio. Sugiero mantener mix actual.',
    'default': 'Procesando tu consulta con datos de 6 colmenas, 8 productos y 87 clientes activos. ¿Puedes ser más específico? Intenta preguntar sobre sachets, expansión a Ancud, o márgenes.',
};

interface SimScenario { label: string; production: string; revenue: string; investment: string; roi: string; risk: string; riskColor: string; }
const scenarios: SimScenario[] = [
    { label: 'Duplicar colmenas en 2027', production: '5.6 ton', revenue: '$8.4M', investment: '$1.2M', roi: '18 meses', risk: 'Moderado', riskColor: 'var(--salud-atencion)' },
    { label: 'Expandir sachets en Santiago', production: '3.2 ton', revenue: '$6.1M', investment: '$400K', roi: '8 meses', risk: 'Bajo', riskColor: 'var(--salud-optima)' },
    { label: 'Abrir apiario nuevo en Ancud', production: '4.1 ton', revenue: '$7.2M', investment: '$800K', roi: '14 meses', risk: 'Moderado', riskColor: 'var(--salud-atencion)' },
];

export default function GerenteView() {
    const { greeting, title, subtitle } = roleGreetings.gerente;
    const [expandedChart, setExpandedChart] = useState<string | null>(null);
    const [scenarioIdx, setScenarioIdx] = useState(0);
    const [localCashFlow, setLocalCashFlow] = useState(cashFlowData);
    const [showTxForm, setShowTxForm] = useState(false);
    const [txForm, setTxForm] = useState({ month: 'Jul', income: 0, expenses: 0 });

    const [chatMessages, setChatMessages] = useState([
        { from: 'ai', text: 'Cristina, con los datos actuales, el próximo lote de sachets con cacao nibs debería salir en 18 días y tenemos demanda en La Reina para 400 unidades. Sugiero priorizar la cosecha de Ulmo Mayor.' },
        { from: 'ai', text: 'La expansión a Ancud muestra mejor ROI que aumentar sachets en Santiago en Q2. ¿Quieres ver el análisis completo?' },
    ]);
    const [chatInput, setChatInput] = useState('');

    const handleAddTx = () => {
        const idx = localCashFlow.findIndex(c => c.month === txForm.month);
        if (idx >= 0) {
            const copy = [...localCashFlow];
            copy[idx] = { ...copy[idx], income: copy[idx].income + txForm.income, expenses: copy[idx].expenses + txForm.expenses };
            setLocalCashFlow(copy);
        } else {
            setLocalCashFlow([...localCashFlow, txForm]);
        }
        setShowTxForm(false);
        setTxForm({ month: 'Jul', income: 0, expenses: 0 });
    };

    const handleChat = () => {
        if (!chatInput.trim()) return;
        const userMsg = chatInput.trim();
        setChatMessages(prev => [...prev, { from: 'user', text: userMsg }]);
        setChatInput('');
        const lower = userMsg.toLowerCase();
        const responseKey = lower.includes('sachet') ? 'sachet' : lower.includes('ancud') ? 'ancud' : lower.includes('margen') ? 'margen' : 'default';
        setTimeout(() => {
            setChatMessages(prev => [...prev, { from: 'ai', text: aiResponses[responseKey] }]);
        }, 800);
    };

    const sc = scenarios[scenarioIdx];

    return (
        <div>
            {/* Fullscreen chart modal */}
            {expandedChart && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }} onClick={() => setExpandedChart(null)} />
                    <div className="card" style={{ position: 'relative', zIndex: 201, width: '90%', maxWidth: 900, padding: 'var(--space-xl)', animation: 'fadeInUp 0.3s ease' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                            <h3>{expandedChart === 'production' ? 'Producción 2026' : expandedChart === 'revenue' ? 'Revenue por Formato' : 'Flujo de Caja'}</h3>
                            <button className="btn btn-ghost btn-sm" onClick={() => setExpandedChart(null)}><Minimize2 size={18} /></button>
                        </div>
                        <div style={{ height: 400 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                {expandedChart === 'production' ? (
                                    <AreaChart data={productionData}><CartesianGrid strokeDasharray="3 3" stroke="rgba(10,61,47,0.08)" /><XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#8A9AAF" /><YAxis tick={{ fontSize: 12 }} stroke="#8A9AAF" /><Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontFamily: 'Inter', fontSize: '0.82rem' }} /><Area type="monotone" dataKey="projected" stroke="#D4A017" fill="rgba(212,160,23,0.1)" strokeDasharray="5 5" /><Area type="monotone" dataKey="actual" stroke="#0A3D2F" fill="rgba(10,61,47,0.15)" strokeWidth={2} /></AreaChart>
                                ) : expandedChart === 'revenue' ? (
                                    <BarChart data={revenueByProduct} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="rgba(10,61,47,0.08)" horizontal={false} /><XAxis type="number" tick={{ fontSize: 11 }} stroke="#8A9AAF" /><YAxis dataKey="product" type="category" tick={{ fontSize: 12 }} stroke="#8A9AAF" width={70} /><Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontFamily: 'Inter', fontSize: '0.82rem' }} /><Bar dataKey="revenue" fill="#0A3D2F" radius={[0, 4, 4, 0]} /></BarChart>
                                ) : (
                                    <AreaChart data={localCashFlow}><CartesianGrid strokeDasharray="3 3" stroke="rgba(10,61,47,0.08)" /><XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#8A9AAF" /><YAxis tick={{ fontSize: 12 }} stroke="#8A9AAF" /><Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontFamily: 'Inter', fontSize: '0.82rem' }} /><Area type="monotone" dataKey="income" stroke="#2ECC71" fill="rgba(46,204,113,0.12)" strokeWidth={2} /><Area type="monotone" dataKey="expenses" stroke="#E74C3C" fill="rgba(231,76,60,0.08)" strokeWidth={2} /></AreaChart>
                                )}
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            <div className="hero-banner animate-in"><div className="hero-greeting">{greeting}</div><h1 className="hero-title">{title}</h1><p className="hero-subtitle">{subtitle}</p></div>
            <div className="stats-grid">
                {[
                    { icon: <Target size={20} />, val: '2.8 ton', label: 'Producción proyectada 2026', trend: '+18%' },
                    { icon: <DollarSign size={20} />, val: '$4.2M', label: 'Facturación YTD', trend: '+24%' },
                    { icon: <BarChart3 size={20} />, val: '72%', label: 'Margen sachets (mejor)' },
                    { icon: <Leaf size={20} />, val: '250 ton', label: 'CO₂ secuestrado total', trend: '+120' },
                ].map((s, i) => (
                    <div key={i} className={`stat-card animate-in delay-${i + 1}`}><div className="stat-header"><div className="stat-icon">{s.icon}</div>{s.trend && <span className="stat-trend up"><ArrowUpRight size={12} /> {s.trend}</span>}</div><div className="stat-value">{s.val}</div><div className="stat-label">{s.label}</div></div>
                ))}
            </div>
            <div className="dashboard-grid dashboard-grid-2" style={{ marginTop: 'var(--space-lg)' }}>
                <div className="card animate-in delay-2"><div className="section-header"><div><div className="section-title">Producción 2026</div><div className="section-subtitle">Real vs Proyección (kg)</div></div><button className="btn btn-ghost btn-sm" onClick={() => setExpandedChart('production')}><Expand size={14} /></button></div><div style={{ height: 260 }}><ResponsiveContainer width="100%" height="100%"><AreaChart data={productionData}><CartesianGrid strokeDasharray="3 3" stroke="rgba(10,61,47,0.08)" /><XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#8A9AAF" /><YAxis tick={{ fontSize: 12 }} stroke="#8A9AAF" /><Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontFamily: 'Inter', fontSize: '0.82rem' }} /><Area type="monotone" dataKey="projected" stroke="#D4A017" fill="rgba(212,160,23,0.1)" strokeDasharray="5 5" /><Area type="monotone" dataKey="actual" stroke="#0A3D2F" fill="rgba(10,61,47,0.15)" strokeWidth={2} /></AreaChart></ResponsiveContainer></div></div>
                <div className="card animate-in delay-3"><div className="section-header"><div><div className="section-title">Revenue por Formato</div><div className="section-subtitle">Miles CLP · Margen %</div></div><button className="btn btn-ghost btn-sm" onClick={() => setExpandedChart('revenue')}><Expand size={14} /></button></div><div style={{ height: 260 }}><ResponsiveContainer width="100%" height="100%"><BarChart data={revenueByProduct} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="rgba(10,61,47,0.08)" horizontal={false} /><XAxis type="number" tick={{ fontSize: 11 }} stroke="#8A9AAF" /><YAxis dataKey="product" type="category" tick={{ fontSize: 12 }} stroke="#8A9AAF" width={70} /><Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontFamily: 'Inter', fontSize: '0.82rem' }} /><Bar dataKey="revenue" fill="#0A3D2F" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div></div>
            </div>
            <div className="dashboard-grid dashboard-grid-2-1" style={{ marginTop: 'var(--space-lg)' }}>
                <div className="card animate-in delay-3">
                    <div className="section-header">
                        <div><div className="section-title">Flujo de Caja</div><div className="section-subtitle">Ingresos vs Egresos (miles CLP)</div></div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-gold btn-sm" onClick={() => setShowTxForm(true)}><Plus size={14} style={{ marginRight: 4 }} /> Fila</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setExpandedChart('cashflow')}><Expand size={14} /></button>
                        </div>
                    </div>
                    {showTxForm && (
                        <div style={{ padding: 'var(--space-md)', background: 'var(--oro-miel-glow)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)', border: '1px solid rgba(212,160,23,0.3)', position: 'relative' }}>
                            <button onClick={() => setShowTxForm(false)} style={{ position: 'absolute', top: 12, right: 12, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={16} /></button>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--bosque-ulmo)', marginBottom: 'var(--space-sm)' }}>Registrar Movimiento</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 8 }}>
                                <input type="text" placeholder="Mes (Ene, Feb...)" className="input-field" value={txForm.month} onChange={e => setTxForm({ ...txForm, month: e.target.value })} />
                                <input type="number" placeholder="Ingreso" className="input-field" value={txForm.income || ''} onChange={e => setTxForm({ ...txForm, income: parseInt(e.target.value) || 0 })} />
                                <input type="number" placeholder="Egreso" className="input-field" value={txForm.expenses || ''} onChange={e => setTxForm({ ...txForm, expenses: parseInt(e.target.value) || 0 })} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button className="btn btn-primary btn-sm" onClick={handleAddTx}>Confirmar Base</button>
                            </div>
                        </div>
                    )}
                    <div style={{ height: 220 }}><ResponsiveContainer width="100%" height="100%"><AreaChart data={localCashFlow}><CartesianGrid strokeDasharray="3 3" stroke="rgba(10,61,47,0.08)" /><XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#8A9AAF" /><YAxis tick={{ fontSize: 12 }} stroke="#8A9AAF" /><Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontFamily: 'Inter', fontSize: '0.82rem' }} /><Area type="monotone" dataKey="income" stroke="#2ECC71" fill="rgba(46,204,113,0.12)" strokeWidth={2} /><Area type="monotone" dataKey="expenses" stroke="#E74C3C" fill="rgba(231,76,60,0.08)" strokeWidth={2} /></AreaChart></ResponsiveContainer></div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                    {/* Simulator with scenario switching */}
                    <div className="card animate-in delay-4" style={{ border: '1px solid rgba(212,160,23,0.2)' }}>
                        <div className="section-title" style={{ fontSize: '1rem', marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 8 }}><TrendingUp size={18} style={{ color: 'var(--oro-miel-dark)' }} /> Simulador de Crecimiento</div>
                        <div style={{ display: 'flex', gap: 'var(--space-xs)', marginBottom: 'var(--space-md)', flexWrap: 'wrap' }}>
                            {scenarios.map((s, i) => (<button key={i} className={`btn btn-sm ${i === scenarioIdx ? 'btn-gold' : 'btn-outline'}`} style={{ fontSize: '0.72rem' }} onClick={() => setScenarioIdx(i)}>{s.label}</button>))}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                            <div style={{ padding: 'var(--space-md)', borderRadius: 'var(--radius-sm)', background: 'rgba(46,204,113,0.08)', textAlign: 'center' }}><div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--salud-optima)' }}>{sc.production}</div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Producción</div></div>
                            <div style={{ padding: 'var(--space-md)', borderRadius: 'var(--radius-sm)', background: 'var(--oro-miel-glow)', textAlign: 'center' }}><div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--oro-miel-dark)' }}>{sc.revenue}</div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Revenue</div></div>
                        </div>
                        <div style={{ marginTop: 'var(--space-md)', padding: 'var(--space-md)', background: 'rgba(10,61,47,0.04)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}><strong style={{ color: 'var(--bosque-ulmo)' }}>Inversión:</strong> {sc.investment}<br /><strong style={{ color: 'var(--bosque-ulmo)' }}>ROI:</strong> {sc.roi}<br /><strong style={{ color: 'var(--bosque-ulmo)' }}>Riesgo:</strong> <span style={{ color: sc.riskColor }}>{sc.risk}</span></div>
                    </div>
                    {/* La Reina AI Chat – fully interactive */}
                    <div className="ai-panel animate-in delay-5">
                        <div className="ai-panel-header"><Crown size={18} style={{ color: 'var(--oro-miel)' }} /><span className="ai-panel-title">La Reina · IA Asistente</span></div>
                        <div className="ai-panel-body" style={{ maxHeight: 280 }}>
                            {chatMessages.map((msg, i) => (
                                <div key={i} className="ai-message" style={{ flexDirection: msg.from === 'user' ? 'row-reverse' : 'row' }}>
                                    <div className="ai-message-avatar">{msg.from === 'ai' ? '👑' : 'CL'}</div>
                                    <div className="ai-message-content" style={{ background: msg.from === 'user' ? 'var(--oro-miel-glow)' : 'rgba(10,61,47,0.04)' }}>{msg.text}</div>
                                </div>
                            ))}
                        </div>
                        <div className="ai-panel-input">
                            <input type="text" placeholder="Pregúntale a La Reina..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleChat(); }} />
                            <button className="btn btn-gold btn-sm" onClick={handleChat}><ArrowUpRight size={14} /></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
