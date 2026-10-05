import { NextResponse } from 'next/server';

export const revalidate = 3600;

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.cl';

  const openApiSpec = {
    openapi: '3.1.0',
    info: {
      title: 'Enjambre Legado — Tienda & Agente API',
      version: '1.0.0',
      description:
        'API pública y de herramientas para agentes de Inteligencia Artificial que interactúan con La Obrera y el Zángano (OYZ). Permite consultar catálogo botánico, trazabilidad de lotes, orígenes en Chiloé, ontología del cliente y simulación de pedidos.',
      contact: {
        name: 'La Obrera y el Zángano',
        url: siteUrl,
        email: 'contacto@obrerayzangano.cl',
      },
    },
    servers: [
      {
        url: siteUrl,
        description: 'Servidor oficial de producción',
      },
    ],
    paths: {
      '/api/knowledge': {
        get: {
          summary: 'Obtener el grafo general de conocimiento (JSON-LD)',
          operationId: 'getKnowledgeGraph',
          responses: {
            '200': {
              description: 'Grafo Schema.org completo con datos de la organización y datasets.',
              content: {
                'application/ld+json': {
                  schema: { type: 'object' },
                },
              },
            },
          },
        },
      },
      '/api/knowledge/products': {
        get: {
          summary: 'Listar catálogo de mieles crudas con trazabilidad y métricas de impacto',
          operationId: 'getProducts',
          responses: {
            '200': {
              description: 'Lista estructurada de productos disponibles con stock y especificaciones de lote.',
              content: {
                'application/ld+json': {
                  schema: { type: 'object' },
                },
              },
            },
          },
        },
      },
      '/api/knowledge/origins': {
        get: {
          summary: 'Consultar información geográfica, apiarios y floraciones de Chiloé',
          operationId: 'getOrigins',
          responses: {
            '200': {
              description: 'Perfiles organolépticos de floraciones (Ulmo, Tiaca, Melí, Luma) y coordenadas de apiarios.',
              content: {
                'application/ld+json': {
                  schema: { type: 'object' },
                },
              },
            },
          },
        },
      },
      '/api/knowledge/harvests': {
        get: {
          summary: 'Consultar lotes de recolección y análisis de laboratorio',
          operationId: 'getHarvests',
          responses: {
            '200': {
              description: 'Lotes analizados con mediciones de humedad, HMF y polen nativo.',
              content: {
                'application/ld+json': {
                  schema: { type: 'object' },
                },
              },
            },
          },
        },
      },
      '/api/knowledge/customer-experience': {
        get: {
          summary: 'Consultar la ontología del dashboard de clientes y el sistema de lealtad y vínculo territorial',
          operationId: 'getCustomerExperience',
          responses: {
            '200': {
              description: 'Definición de módulos del cliente: Pasaporte, Reposición, Billetera y Rituales.',
              content: {
                'application/ld+json': {
                  schema: { type: 'object' },
                },
              },
            },
          },
        },
      },
      '/api/agents/order': {
        post: {
          summary: 'Crear o validar un pedido en nombre de un usuario delegado',
          operationId: 'createAgentOrder',
          parameters: [
            {
              name: 'x-agent-delegation',
              in: 'header',
              required: true,
              schema: { type: 'string' },
              description: 'Identificador de delegación de agente otorgado por el usuario',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['product_slug', 'quantity', 'shipping'],
                  properties: {
                    product_slug: { type: 'string', example: 'miel-de-ulmo-500g' },
                    quantity: { type: 'integer', minimum: 1, maximum: 10, default: 1 },
                    shipping: {
                      type: 'object',
                      required: ['name', 'address', 'city', 'region'],
                      properties: {
                        name: { type: 'string' },
                        address: { type: 'string' },
                        city: { type: 'string' },
                        region: { type: 'string' },
                        phone: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Pedido validado con URL de checkout para confirmación final del usuario.',
            },
            '401': { description: 'Requiere autenticación delegada válida.' },
            '409': { description: 'Stock insuficiente.' },
          },
        },
      },
    },
  };

  return NextResponse.json(openApiSpec, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
