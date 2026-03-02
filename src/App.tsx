import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import MapaView from './views/MapaView';
import ApicultorView from './views/ApicultorView';
import VendedorView from './views/VendedorView';
import GerenteView from './views/GerenteView';
import LogisticaView from './views/LogisticaView';
import MarketingView from './views/MarketingView';
import ClienteView from './views/ClienteView';
import RegeneracionView from './views/RegeneracionView';

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
  const [role, setRole] = useState('apicultor');
  const location = useLocation();
  const headerTitle = titleMap[location.pathname] || 'Enjambre Legado';

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
        <Route path="*" element={<Navigate to="/apicultor" replace />} />
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
