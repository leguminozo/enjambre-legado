/** Datos de demostración hasta conectar API / Supabase. */

export type DashboardPeriod = '7d' | '30d' | '90d';

export function getMockDashboard(period: DashboardPeriod) {
  const days = period === '7d' ? 7 : period === '30d' ? 14 : 21;
  const chartData = {
    sessions: Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      return {
        date: d.toISOString().slice(0, 10),
        current: 80 + Math.round(Math.random() * 60),
        previous: 60 + Math.round(Math.random() * 50),
      };
    }),
  };

  return {
    overview: {
      sessions: { current: 12_847, change: 12, trend: 'increase' as const },
      totalSales: { current: 4_892_000, change: 8, trend: 'increase' as const },
      orders: { current: 312, change: 3, trend: 'decrease' as const },
      conversionRate: { current: 3.2, change: 0.4, trend: 'increase' as const },
    },
    chartData,
    liveVisitors: 24 + Math.floor(Math.random() * 20),
    channels: 'Tienda online · Enjambre Legado',
    period:
      period === '7d'
        ? 'Últimos 7 días'
        : period === '30d'
          ? 'Últimos 30 días'
          : 'Últimos 90 días',
  };
}

export const mockProducts = [
  {
    id: '1',
    name: 'Miel de Ulmo 500g',
    sku: 'ULM-500',
    price: 18990,
    status: 'active' as const,
    inventory: 42,
    category: 'Miel',
  },
  {
    id: '2',
    name: 'Miel de Tiaca 250g',
    sku: 'TIA-250',
    price: 12990,
    status: 'active' as const,
    inventory: 0,
    category: 'Miel',
  },
  {
    id: '3',
    name: 'Pack Regalo Bosque',
    sku: 'PCK-GFT',
    price: 45990,
    status: 'draft' as const,
    inventory: 12,
    category: 'Packs',
  },
];

export const mockOrders = [
  {
    id: '1001',
    customer: 'María González',
    total: 37980,
    status: 'paid' as const,
    preparation: 'prepared' as const,
    channel: 'Web',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: '1002',
    customer: 'Pedro Soto',
    total: 18990,
    status: 'pending' as const,
    preparation: 'unprepared' as const,
    channel: 'Web',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const mockCustomers = [
  {
    id: 'c1',
    name: 'María González',
    email: 'maria@example.com',
    phone: '+56 9 1234 5678',
    city: 'Santiago',
    orders: 5,
    totalSpent: 125_000,
    subscribed: true,
    lastOrder: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'c2',
    name: 'Pedro Soto',
    email: 'pedro@example.com',
    phone: '+56 9 8765 4321',
    city: 'Valdivia',
    orders: 1,
    totalSpent: 18_990,
    subscribed: false,
    lastOrder: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const mockCollections = [
  {
    id: 'col1',
    title: 'Mieles nativas',
    productsCount: 8,
    status: 'active' as const,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'col2',
    title: 'Regalos corporativos',
    productsCount: 3,
    status: 'draft' as const,
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];
