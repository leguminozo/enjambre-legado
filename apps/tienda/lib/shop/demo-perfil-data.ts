import type { PerfilDashboardData } from '@/lib/shop/perfil-dashboard';
import type { TiendaUserProfile } from '@/lib/shop/user-profile';
import type { OrderTimelineItem } from '@/components/perfil/orders-timeline';

export function getDemoUser(): TiendaUserProfile {
  return {
    id: 'demo-agente-guardian-01',
    full_name: 'Guardián Centinela',
    email: 'agente-explorador@obrerayzangano.cl',
    role: 'cliente',
    arboles_personal: 12,
    avatar_url: null,
  };
}

export function getDemoDashboardData(): PerfilDashboardData {
  return {
    user: getDemoUser(),
    tierData: {
      tier: 'COLMENA',
      tier_nombre: 'Guardián Legado',
      tier_icono: '🏛️',
      tier_color_token: 'accent',
      tier_narrativa: 'Máxima distinción de alianza territorial y regeneración del bosque de Chiloé.',
      tier_priority: 4,
      ciclos_historicos: 6,
    },
    tierConfigs: [
      {
        tier: 'OBRERA',
        nombre_display: 'Iniciador',
        icono: '🌱',
        color_token: 'accent',
        min_ciclos: 0,
        min_spent: 0,
        min_trees: 0,
        priority: 1,
        etiqueta_narrativa: 'Primeros vínculos con el bosque nativo y recolecciones de autor.',
        activo: true,
      },
      {
        tier: 'ZÁNGANO',
        nombre_display: 'Aliado del Enjambre',
        icono: '🐝',
        color_token: 'accent',
        min_ciclos: 500,
        min_spent: 50000,
        min_trees: 0,
        priority: 2,
        etiqueta_narrativa: 'Compromiso activo con el colmenar y reposición periódica.',
        activo: true,
      },
      {
        tier: 'REINA',
        nombre_display: 'Círculo de la Reina',
        icono: '👑',
        color_token: 'accent',
        min_ciclos: 2000,
        min_spent: 150000,
        min_trees: 5,
        priority: 3,
        etiqueta_narrativa: 'Protector distinguido de floraciones selectas y árboles nativos.',
        activo: true,
      },
      {
        tier: 'COLMENA',
        nombre_display: 'Guardián Legado',
        icono: '🏛️',
        color_token: 'accent',
        min_ciclos: 5000,
        min_spent: 300000,
        min_trees: 10,
        priority: 4,
        etiqueta_narrativa: 'Máxima distinción de alianza territorial y regeneración del bosque de Chiloé.',
        activo: true,
      },
    ],
    hiveData: {
      name: 'Colmena Centinela #04 — Bosque Nativo',
      estado: 'Óptima',
      peso_kg: 28.5,
    },
    orders: [
      {
        id: 'ord-demo-001',
        created_at: '2026-02-28T14:30:00Z',
        total: 38900,
        estado: 'entregado',
        pedido_items: [
          {
            cantidad: 2,
            productos: {
              nombre: 'Miel de Ulmo Cruda — Reserva 500g',
              precio: 15900,
            },
          },
          {
            cantidad: 1,
            productos: {
              nombre: 'Gotas de Néctar — Sachet Selección',
              precio: 7100,
            },
          },
        ],
      },
      {
        id: 'ord-demo-002',
        created_at: '2026-01-15T11:20:00Z',
        total: 32000,
        estado: 'entregado',
        pedido_items: [
          {
            cantidad: 1,
            productos: {
              nombre: 'Cofre del Enjambre — 20 Dosis Botánicas',
              precio: 32000,
            },
          },
        ],
      },
    ],
    claimPoints: [],
    ecosystemMetrics: {
      arboles_total: 120,
      co2_ton: 1.8,
      especies_nativas: 6,
      sectores: 3,
      colmenas_total: 12,
      apiarios_total: 2,
      irr_ecosistema: 1.42,
      co2_capturado_kg: 1800,
      co2_emitido_kg: 420,
      productos_activos: 8,
      azucar_sustituida_g: 14500,
      co2_evitado_total_kg: 36.2,
      anos_legado: '2008–2026',
    },
    stats: {
      totalOrders: 3,
      totalSpent: 89700,
    },
    hasAddress: true,
    hasSubscription: true,
    pointsBalance: 450,
  };
}

export function getDemoOrders(): OrderTimelineItem[] {
  return [
    {
      id: 'demo-vta-101',
      created_at: '2026-02-28T14:30:00Z',
      total: 38900,
      estado: 'entregado',
      items: [
        {
          nombre: 'Miel de Ulmo Cruda — Reserva 500g',
          cantidad: 2,
          precio_unitario: 15900,
          slug: 'miel-de-ulmo-500g',
        },
        {
          nombre: 'Gotas de Néctar — Sachet Selección',
          cantidad: 1,
          precio_unitario: 7100,
          slug: 'sachets-gotas-de-nectar',
        },
      ],
      lotes: ['LOTE-2026-A1', 'LOTE-2026-B2'],
      logistica_envios: [
        {
          tracking_code: 'STK-89214710',
          status: 'entregado',
          via: 'Starken Express',
          courier_code: 'starken',
          eta: '2026-03-02',
        },
      ],
      dte: {
        numero: '1420',
        estado_sii: 'aceptado',
        buyOrder: 'OYZ-2026-0042',
      },
      resena: {
        id: 'res-demo-1',
        rating: 5,
        estado: 'publicada',
      },
    },
    {
      id: 'demo-vta-102',
      created_at: '2026-01-15T11:20:00Z',
      total: 32000,
      estado: 'entregado',
      items: [
        {
          nombre: 'Cofre del Enjambre — 20 Dosis Botánicas',
          cantidad: 1,
          precio_unitario: 32000,
          slug: 'cofre-del-enjambre-20-sachets',
        },
      ],
      logistica_envios: [
        {
          tracking_code: 'STK-77182910',
          status: 'entregado',
          via: 'Starken Express',
          courier_code: 'starken',
          eta: '2026-01-18',
        },
      ],
      dte: {
        numero: '1205',
        estado_sii: 'aceptado',
        buyOrder: 'OYZ-2026-0018',
      },
    },
  ];
}

import type { WalletGuardianSnapshot } from '@enjambre/wallet';

export function getDemoWalletSnapshot(): WalletGuardianSnapshot {
  return {
    userId: 'demo-agente-guardian-01',
    displayName: 'Guardián Centinela',
    tier: 'COLMENA',
    tierNombre: 'Guardián Legado',
    tierIcono: '🏛️',
    tierColorToken: 'accent',
    tierNarrativa: 'Máxima distinción de alianza territorial y regeneración del bosque de Chiloé.',
    ciclos: 6,
    puntos: 450,
    programs: [
      {
        programId: 'prog-sachets',
        label: 'Gotas de Néctar (Sachets 15g)',
        accumulated: 4,
        required: 5,
        remaining: 1,
        eligibleForFree: false,
        progressPct: 80,
      },
      {
        programId: 'prog-frascos',
        label: 'Tesoros del Colmenar (Frascos 250g/500g)',
        accumulated: 2,
        required: 3,
        remaining: 1,
        eligibleForFree: false,
        progressPct: 66,
      },
      {
        programId: 'prog-cofres',
        label: 'Cofres del Enjambre (20 Dosis)',
        accumulated: 2,
        required: 2,
        remaining: 0,
        eligibleForFree: true,
        progressPct: 100,
      },
    ],
  };
}

