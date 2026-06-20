import { test, expect } from '@playwright/test';

const META_RECEIPT = `
Meta Ads Billing Statement
Meta for Business
Invoice # INV-META-2026-001
Billing period: June 2026
Total: USD 150.00
June 15, 2026
`;

const PARSED_GASTO = {
  proveedorId: 'meta-ads',
  proveedorRut: '55555555-5',
  proveedorNombre: 'Meta Platforms',
  proveedorGiro: 'Publicidad digital',
  montoOriginal: 150,
  monedaOriginal: 'USD',
  montoCLP: 142500,
  tasaCambio: 950,
  montoNeto: 0,
  montoExento: 142500,
  montoIva: 0,
  montoTotal: 142500,
  fechaEmision: '2026-06-15',
  numeroDocumento: 'INV-META-2026-001',
  concepto: 'Servicio de publicidad digital Meta Ads',
  detalle: 'Meta Ads',
};

const BANDEJA_ROW = {
  id: 'gasto-e2e-1',
  proveedor_id: 'meta-ads',
  proveedor_nombre: 'Meta Platforms',
  proveedor_rut: '55555555-5',
  monto_total: 142500,
  monto_clp: 142500,
  moneda_original: 'USD',
  fecha_emision: '2026-06-15',
  numero_documento: 'INV-META-2026-001',
  concepto: 'Servicio de publicidad digital Meta Ads',
  estado: 'aceptado_sii',
  factura_compra_id: 'fc-e2e-1',
  fiscal_document_id: null,
  created_at: '2026-06-19T12:00:00.000Z',
  fiscal_documents: null,
};

function jsonResponse(data: unknown, status = 200) {
  return {
    status,
    contentType: 'application/json',
    body: JSON.stringify({ data }),
  };
}

test.describe('Bandeja Fiscal', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/sii/gastos-extranjero/**', async (route) => {
      const url = route.request().url();
      const method = route.request().method();

      if (url.includes('/proveedores') && method === 'GET') {
        await route.fulfill(
          jsonResponse([
            { id: 'meta-ads', nombre: 'Meta Ads', rut: '55555555-5', moneda: 'USD' },
            { id: 'openai', nombre: 'OpenAI', rut: '55555555-5', moneda: 'USD' },
          ]),
        );
        return;
      }

      if (url.includes('/bandeja') && method === 'GET') {
        await route.fulfill(jsonResponse([BANDEJA_ROW]));
        return;
      }

      if (url.includes('/parse') && method === 'POST') {
        await route.fulfill(jsonResponse(PARSED_GASTO));
        return;
      }

      if (url.includes('/procesar') && method === 'POST') {
        await route.fulfill(
          jsonResponse(
            {
              ok: true,
              alreadyProcessed: false,
              gastoId: 'gasto-e2e-1',
              facturaCompraId: 'fc-e2e-1',
              idempotencyKey: 'hash-e2e',
              encolado: true,
              jobId: 'job-e2e-1',
              warnings: ['Emisión encolada; el cron fiscal enviará el DTE al SII'],
            },
            201,
          ),
        );
        return;
      }

      await route.fulfill({ status: 404, body: 'not mocked' });
    });
  });

  test('muestra bandeja fiscal y procesa recibo Meta por texto', async ({ page }) => {
    await page.goto('/sii');

    await expect(page.getByRole('heading', { name: /SII · Facturación Electrónica/i })).toBeVisible();

    await page.getByTestId('sii-tab-gasto').click();
    await expect(page.getByTestId('bandeja-fiscal')).toBeVisible();

    await page.getByTestId('bandeja-mode-texto').click();
    await page.getByTestId('bandeja-receipt-text').fill(META_RECEIPT);
    await page.getByTestId('bandeja-analizar-btn').click();

    await expect(page.getByTestId('bandeja-fiscal').getByText('Meta Platforms').first()).toBeVisible();
    await expect(page.getByTestId('bandeja-fiscal').getByText('INV-META-2026-001').first()).toBeVisible();

    await page.getByTestId('bandeja-procesar-btn').click();

    await expect(page.getByTestId('bandeja-resultado')).toBeVisible();
    await expect(page.getByText('Pipeline completado')).toBeVisible();
    await expect(page.getByText('fc-e2e-1')).toBeVisible();
  });

  test('muestra cola de documentos con filtro de estado', async ({ page }) => {
    await page.goto('/sii');
    await page.getByTestId('sii-tab-gasto').click();

    await expect(page.getByTestId('bandeja-cola')).toBeVisible();
    await expect(page.getByText('Meta Platforms')).toBeVisible();
    await expect(page.getByText('Servicio de publicidad digital Meta Ads')).toBeVisible();

    await page.getByRole('button', { name: 'Aceptados' }).click();
    await expect(page.getByText('Meta Platforms')).toBeVisible();
  });
});