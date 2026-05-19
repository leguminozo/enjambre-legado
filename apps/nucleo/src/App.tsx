import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import AppLayout from './components/layout/AppLayout';
import AuthView from './views/AuthView';
import MapaView from './views/MapaView';
import ApicultorView from './views/ApicultorView';
import RegeneracionView from './views/RegeneracionView';
import VendedorView from './views/VendedorView';
import LogisticaView from './views/LogisticaView';
import MarketingView from './views/MarketingView';
import CreadorView from './views/CreadorView';
import GerenteView from './views/GerenteView';
import ContableView from './views/ContableView';
import type { Session } from '@supabase/supabase-js';

const titleMap: Record<string, string> = {
  '/mapa': 'Mapa del Legado',
  '/colmenas': 'Colmenas & Apiarios',
  '/regeneracion': 'Regeneración',
  '/catalogo': 'Catálogo & CRM',
  '/operaciones': 'Operaciones & Stock',
  '/comunidad': 'Comunidad & Marketing',
  '/creador': 'Portal de Creador',
  '/contable': 'Sistema Contable',
  '/gerente': 'Panel Ejecutivo',
};

const roleDefaultPaths: Record<string, string> = {
  apicultor: '/colmenas',
  vendedor: '/catalogo',
  gerente: '/gerente',
  logistica: '/operaciones',
  marketing: '/comunidad',
  creador: '/creador',
};

function AppContent() {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();
  const headerTitle = titleMap[location.pathname] || 'Enjambre Legado';

  useEffect(() => {
    // 1. Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfileAndRoute(session);
      else setLoading(false);
    });

    // 2. Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        setSession(null);
        setRole(null);
        setLoading(false);
        navigate('/');
        return;
      }
      setSession(session);
      if (session) fetchProfileAndRoute(session);
      else {
        setRole(null);
        setLoading(false);
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchProfileAndRoute = async (currentSession: Session) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentSession.user.id)
        .single();

      if (error) throw error;

      const userRole = data?.role || 'apicultor';
      setRole(userRole);

      if (location.pathname === '/' || location.pathname === '/auth') {
        navigate(roleDefaultPaths[userRole] || '/mapa');
      }
    } catch (err) {
      console.error("Error fetching profile role:", err);
      setRole('apicultor');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)', color: 'var(--bosque-ulmo)' }}>
        Verificando identidad...
      </div>
    );
  }

  // Si no hay sesión, obligamos a ver el AuthView
  if (!session) {
    return <AuthView />;
  }

  // Wait until role is fetched before rendering layout to avoid layout thrashing
  if (!role) return null;

  return (
    <AppLayout currentRole={role} headerTitle={headerTitle}>
      <Routes>
        <Route path="/mapa" element={<MapaView />} />
        <Route path="/colmenas" element={<ApicultorView />} />
        <Route path="/regeneracion" element={<RegeneracionView />} />
        <Route path="/catalogo" element={<VendedorView />} />
        <Route path="/operaciones" element={<LogisticaView />} />
        <Route path="/comunidad" element={<MarketingView />} />
        <Route path="/creador" element={<CreadorView currentRole={role ?? undefined} userId={session?.user?.id ?? undefined} />} />
        <Route path="/contable" element={<ContableView />} />
        <Route path="/gerente" element={<GerenteView />} />

        <Route path="*" element={<Navigate to="/mapa" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
