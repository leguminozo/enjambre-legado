import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@enjambre/ui';
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
import NucleoView from './views/NucleoView';
import ContableView from './views/ContableView';
import ConfiguracionView from './views/ConfiguracionView';
import type { Session } from '@supabase/supabase-js';

const titleMap: Record<string, string> = {
  '/mapa': 'Mapa del Legado',
  '/colmenas': 'Colmenas & Apiarios',
  '/regeneracion': 'Regeneración',
  '/catalogo': 'Catálogo & CRM',
  '/operaciones': 'Operaciones & Stock',
  '/comunidad': 'Comunidad & Marketing',
  '/creador': 'Portal de Creador',
  '/nucleo': 'Núcleo',
  '/contable': 'Sistema Contable',
  '/configuracion': 'Configuración',
};

function AppContent() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const headerTitle = titleMap[location.pathname] || 'Enjambre Legado';

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        setSession(null);
        setLoading(false);
        return;
      }
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)', color: 'var(--bosque-ulmo)' }}>
        Cargando...
      </div>
    );
  }

  // Si no hay sesión, mostrar AuthView
  if (!session) {
    return <AuthView />;
  }

  // Usuario autenticado: mostrar todo el sistema
  return (
    <AppLayout currentRole="admin" headerTitle={headerTitle}>
      <Routes>
        <Route path="/" element={<Navigate to="/nucleo" replace />} />
        <Route path="/mapa" element={<MapaView />} />
        <Route path="/colmenas" element={<ApicultorView />} />
        <Route path="/regeneracion" element={<RegeneracionView />} />
        <Route path="/catalogo" element={<VendedorView />} />
        <Route path="/operaciones" element={<LogisticaView />} />
        <Route path="/comunidad" element={<MarketingView />} />
        <Route path="/creador" element={<CreadorView currentRole="admin" userId={session?.user?.id} />} />
<Route path="/nucleo" element={<NucleoView />} />
<Route path="/contable" element={<ContableView />} />
<Route path="/configuracion" element={<ConfiguracionView />} />
<Route path="*" element={<Navigate to="/nucleo" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="system">
        <AppContent />
      </ThemeProvider>
    </BrowserRouter>
  );
}
