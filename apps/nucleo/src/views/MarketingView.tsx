import { useState, useEffect } from 'react';
import { Megaphone, Users, Camera, Calendar, Gift, BookOpen, ArrowUpRight, X } from 'lucide-react';
import { ViewShell } from '@/components/layout/ViewShell';
import { EnjTableShell } from '@/components/layout/EnjTableShell';
import { supabase } from '../lib/supabase';

interface MarketingPost {
  id: string;
  post_date: string;
  date: string;
  type: string;
  content: string;
  platform: string;
  status: string;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  period: string;
  impact: string;
}

interface LocalClient {
  id: string;
  name: string;
  type: string;
  [k: string]: string;
}

export function MarketingView() {
  const [userProfile, setUserProfile] = useState<{ full_name?: string } | null>(null);
  const [posts, setPosts] = useState<MarketingPost[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [localClients, setLocalClients] = useState<LocalClient[]>([]);
  const [activeSubscriptions, setActiveSubscriptions] = useState(0);
  const [monthlyClubRevenue, setMonthlyClubRevenue] = useState(0);
  const [assetCounts, setAssetCounts] = useState({ fotos: 0, videos: 0, textos: 0, logos: 0 });
  const [showNewPost, setShowNewPost] = useState(false);
  const [postForm, setPostForm] = useState({ post_date: '12 mar', type: 'Reel', content: '', status: 'Borrador', platform: 'IG' });

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const uid = user.id;

      const { data: prof } = await supabase.from('profiles').select('*').eq('id', uid).single();
      setUserProfile(prof);

      const [resP, resC] = await Promise.all([
        supabase.from('marketing_posts').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
        supabase.from('marketing_campaigns').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      ]);

      setPosts(resP.data ?? []);
      setCampaigns(resC.data ?? []);

      const { data: clientData } = await supabase.from('clientes').select('id, name, type').eq('user_id', uid);
      setLocalClients(Array.isArray(clientData) ? (clientData as unknown as LocalClient[]) : []);

      const { data: subsData } = await supabase
        .from('subscriptions')
        .select('status, plan:subscription_plans(price_clp, frequency)')
        .eq('status', 'active');

      const subs = subsData ?? [];
      setActiveSubscriptions(subs.length);
      setMonthlyClubRevenue(subs.reduce((sum: number, row: Record<string, unknown>) => {
        const plan = row.plan as { price_clp?: number; frequency?: string } | null;
        const price = Number(plan?.price_clp) || 0;
        const freq = plan?.frequency ?? 'monthly';
        if (freq === 'quarterly') return sum + price / 3;
        if (freq === 'annual') return sum + price / 12;
        return sum + price;
      }, 0));

      const [productosRes, cmsRes] = await Promise.all([
        supabase.from('productos').select('fotos, video_url'),
        supabase.from('site_content').select('section_key, content').in('section_key', ['galeria', 'footer_branding', 'hero']),
      ]);

      const productos = productosRes.data ?? [];
      const fotos = productos.reduce((n: number, p: { fotos?: string[] | null }) => n + (p.fotos?.length ?? 0), 0);
      const videosProducto = productos.filter((p: { video_url?: string | null }) => Boolean(p.video_url)).length;
      const videosPost = (resP.data ?? []).filter((p: MarketingPost) =>
        /video|reel/i.test(p.type ?? '')
      ).length;

      const cmsItems = cmsRes.data ?? [];
      const logos = cmsItems.filter((item: { section_key: string; content: Record<string, unknown> }) => {
        const c = item.content ?? {};
        return Boolean(c.logo || c.image || c.img || c.src || c.url);
      }).length;

      setAssetCounts({
        fotos,
        videos: videosProducto + videosPost,
        textos: (resP.data ?? []).length,
        logos,
      });
    }
    loadData();
  }, []);

  const assetLibrary = [
    { icon: '📸', label: 'Fotos de cosecha', count: assetCounts.fotos },
    { icon: '🎬', label: 'Videos Cristina en Pureo', count: assetCounts.videos },
    { icon: '📝', label: 'Textos regenerativos', count: assetCounts.textos },
    { icon: '🏷️', label: 'Logos y marca', count: assetCounts.logos },
  ];

  const handleAddPost = async () => {
    if (!postForm.content) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('marketing_posts').insert({
          user_id: user.id,
          ...postForm,
        }).select().single();
        if (data) setPosts([data, ...posts]);
      }
    } catch (e) {
      console.error(e);
    }
    setShowNewPost(false);
    setPostForm({ post_date: '12 mar', type: 'Reel', content: '', status: 'Borrador', platform: 'IG' });
  };

  return (
    <div className="space-y-6 animate-in">
      <ViewShell
        greeting={`¡Hola, ${userProfile?.full_name || 'Diseñador/Marketing'}!`}
        title="Portal de Comunidad y Comunicación"
        subtitle="Gestiona campañas, contenidos y fidelización del Club de Guardianes"
      />

      <div className="stats-grid">
        {[
          { icon: <Users size={20} />, val: String(localClients.length || 0), label: 'Guardianes del Club' },
          { icon: <Camera size={20} />, val: String(activeSubscriptions), label: 'Suscripciones activas' },
          { icon: <Gift size={20} />, val: String(campaigns.filter((c) => c.status === 'Activa').length), label: 'Campañas activas' },
          { icon: <Megaphone size={20} />, val: String(posts.length), label: 'Contenidos programados' },
        ].map((s, i) => (
          <div key={i} className={`stat-card animate-in delay-${i + 1}`}>
            <div className="stat-header"><div className="stat-icon">{s.icon}</div></div>
            <div className="stat-value">{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid dashboard-grid-2-1">
        <div className="flex flex-col gap-6">
          <div className="card animate-in delay-2">
            <div className="section-header">
              <div>
                <div className="section-title flex items-center gap-2">
                  <Calendar size={18} />
                  Calendario de Contenido
                </div>
                <div className="section-subtitle">Marzo 2026</div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setShowNewPost(true)}>+ Contenido</button>
            </div>

            {showNewPost && (
              <div className="inline-form-panel">
                <button
                  onClick={() => setShowNewPost(false)}
                  className="absolute top-3 right-3 text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer"
                  aria-label="Cerrar"
                >
                  <X size={16} />
                </button>
                <div className="text-sm font-semibold text-foreground mb-2">Programar Post</div>
                <div className="grid grid-cols-1 gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Idea de contenido..."
                    className="input-field"
                    value={postForm.content}
                    onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                  />
                </div>
                <div className="form-grid-3 mb-2">
                  <input
                    type="text"
                    placeholder="Fecha (ej: 12 mar)"
                    className="input-field"
                    value={postForm.post_date}
                    onChange={(e) => setPostForm({ ...postForm, post_date: e.target.value })}
                  />
                  <select className="input-field" value={postForm.type} onChange={(e) => setPostForm({ ...postForm, type: e.target.value })}>
                    <option>Reel</option>
                    <option>Story</option>
                    <option>Post</option>
                    <option>Carrusel</option>
                  </select>
                  <select className="input-field" value={postForm.platform} onChange={(e) => setPostForm({ ...postForm, platform: e.target.value })}>
                    <option>IG</option>
                    <option>TikTok</option>
                    <option>LinkedIn</option>
                    <option>FB</option>
                  </select>
                </div>
                <div className="flex justify-end">
                  <button className="btn btn-primary btn-sm" onClick={handleAddPost}>Guardar</button>
                </div>
              </div>
            )}

            <EnjTableShell caption="Desliza para ver columnas del calendario">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Contenido</th>
                    <th>Plataforma</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((p, i) => (
                    <tr key={p.id || i}>
                      <td className="font-medium">{p.post_date || p.date}</td>
                      <td><span className="badge badge-gold">{p.type}</span></td>
                      <td className="text-foreground">{p.content}</td>
                      <td className="text-sm">{p.platform}</td>
                      <td>
                        <span className={`badge ${
                          p.status === 'Programado' ? 'badge-success' :
                          p.status === 'Borrador' ? 'badge-warning' : 'badge-gold'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </EnjTableShell>
          </div>

          <div className="card animate-in delay-3">
            <div className="section-header">
              <div className="section-title">🎁 Campañas Activas</div>
            </div>
            {campaigns.map((c, i) => (
              <div key={c.id || i} className={`campaign-card ${i === 0 ? 'is-featured' : ''}`}>
                <div className="flex justify-between items-center gap-3">
                  <strong className="text-sm text-foreground">{c.name}</strong>
                  <span className={`badge ${c.status === 'Activa' ? 'badge-success' : 'badge-warning'}`}>{c.status}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">📅 {c.period} · 🌳 {c.impact}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="card animate-in delay-3">
            <div className="section-title text-base mb-4">🌿 Club Legado del Bosque</div>
            <div className="club-highlight">
              <div className="font-display text-lg mb-2">{activeSubscriptions} Guardianes Activos</div>
              <div className="text-sm opacity-70">Suscripción desde $15.000/mes</div>
              <div className="text-sm opacity-70 mt-1">
                Ingresos mensuales estimados: ${Math.round(monthlyClubRevenue).toLocaleString('es-CL')}
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Beneficios: miel mensual + acceso a cosechas exclusivas + nombre en bosque regenerado + contenido premium
            </p>
          </div>

          <div className="card animate-in delay-4">
            <div className="section-title text-base mb-4 flex items-center gap-2">
              <BookOpen size={16} />
              Biblioteca de Assets
            </div>
            {assetLibrary.map((a) => (
              <button
                key={a.label}
                className="btn btn-ghost w-full justify-between py-4 mb-1"
                disabled={a.count === 0}
              >
                <span>{a.icon} {a.label} ({a.count})</span>
                <ArrowUpRight size={14} />
              </button>
            ))}
            {assetLibrary.every((a) => a.count === 0) && (
              <p className="text-xs text-muted-foreground px-2 pb-2">
                Sin assets aún. Sube fotos en productos o contenido CMS.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}