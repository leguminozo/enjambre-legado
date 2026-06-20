import { describe, it, expect, vi } from "vitest";
import { obtenerF29Interno, periodoFechaRango } from "../sii/impuestos";

vi.mock("@enjambre/contable", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@enjambre/contable")>();
  return {
    ...actual,
    fetchTasaUF: vi.fn().mockResolvedValue(40766),
  };
});

describe("periodoFechaRango", () => {
  it("calcula rango correcto para diciembre", () => {
    expect(periodoFechaRango(2026, 12)).toEqual({
      desde: "2026-12-01",
      hastaExclusive: "2027-01-01",
    });
  });

  it("calcula rango para mes intermedio", () => {
    expect(periodoFechaRango(2026, 6)).toEqual({
      desde: "2026-06-01",
      hastaExclusive: "2026-07-01",
    });
  });
});

describe("obtenerF29Interno — FC46 aceptadas", () => {
  it("incluye FC46 aceptadas en líneas digitales", async () => {
    const empresaId = "emp-1";
    const fc46Rows = [
      {
        id: "fc-1",
        folio: 101,
        receptor_razon_social: "META PLATFORMS",
        monto_neto: 0,
        monto_exento: 142500,
        monto_iva: 0,
        monto_total: 142500,
        source_type: "meta-ads",
      },
      {
        id: "fc-2",
        folio: 102,
        receptor_razon_social: "OPENAI LLC",
        monto_neto: 0,
        monto_exento: 40375,
        monto_iva: 0,
        monto_total: 40375,
        source_type: "openai",
      },
    ];

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "empresas") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                regimen: "pro_pyme_transparente",
                fecha_inicio_actividades: "2020-01-01",
                ingresos_brutos_anio_anterior: 0,
              },
            }),
          };
        }
        if (table === "periodos_contables") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: { id: "per-1", remanente_cf_anterior: 0 } }),
          };
        }
        if (table === "facturas_emitidas" || table === "gastos" || table === "honorarios") {
          const terminal = vi.fn().mockResolvedValue({ data: [] });
          const eq = vi.fn().mockImplementation(() => ({ eq: terminal }));
          return {
            select: vi.fn().mockReturnValue({ eq }),
          };
        }
        if (table === "facturas_compra") {
          const chain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            lt: vi.fn().mockResolvedValue({ data: fc46Rows }),
          };
          return chain;
        }
        throw new Error(`unexpected table ${table}`);
      }),
    } as any;

    const f29 = await obtenerF29Interno(supabase, empresaId, 2026, 6);

    expect(f29.cantidadDocsDigital).toBe(2);
    expect(f29.montoNetoDigital).toBe(182875);
    expect(f29.fc46Aceptadas).toHaveLength(2);
    expect(f29.debitoFacturas).toBe(0);
    expect(f29.lineas).toBeDefined();
  });
});