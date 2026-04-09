import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import AppLayout from './components/layout/AppLayout';
import AuthView from './views/AuthView';
import MapaView from './views/MapaView';
import ApicultorView from './views/ApicultorView';
import VendedorView from './views/VendedorView';
import GerenteView from './views/GerenteView';
import LogisticaView from './views/LogisticaView';
import MarketingView from './views/MarketingView';
import ClienteView from './views/ClienteView';
import RegeneracionView from './views/RegeneracionView';
import type { Session } from '@supabase/supabase-js';

const titleMap: Record<string, string> = {
  '/mapa': 'Mapa del Legado',
  '/apicultor': 'Mis Colmenas',
  '/apicultor/regeneracion': 'Regeneración',
  '/vendedor': 'Catálogo Vivo',
  '/gerente': 'Panel Ejecutivo',
  '/logistica': 'Operaciones',
  '/marketing': 'Comunidad',
  '/cliente': 'Mi Legado',
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

      // Auto-route to their domain if they are at the root
      if (location.pathname === '/' || location.pathname === '/auth') {
        navigate(`/${userRole}`);
      }
    } catch (err) {
      console.error("Error fetching profile role:", err);
      // Fallback
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
    <AppLayout currentRole={role} onRoleChange={setRole} headerTitle={headerTitle}>
      <Routes>
        <Route path="/mapa" element={<MapaView currentRole={role} />} />
        <Route path="/apicultor" element={<ApicultorView />} />
        <Route path="/apicultor/regeneracion" element={<RegeneracionView />} />
        <Route path="/vendedor" element={<VendedorView />} />
        <Route path="/gerente" element={<GerenteView />} />
        <Route path="/logistica" element={<LogisticaView />} />
        <Route path="/marketing" element={<MarketingView />} />
        <Route path="/cliente" element={<ClienteView />} />

        {/* Redirect unknown routes based on role */}
        <Route path="*" element={<Navigate to={`/${role}`} replace />} />
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
