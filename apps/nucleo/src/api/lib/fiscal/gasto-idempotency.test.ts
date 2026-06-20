import { describe, it, expect, vi } from "vitest";
import { buildGastoIdempotencyKey, findDuplicateGasto } from "./gasto-idempotency";
import type { GastoExtranjeroResult } from "@enjambre/contable";

const sampleGasto: GastoExtranjeroResult = {
  proveedorId: "meta-ads",
  proveedorRut: "55555555-5",
  proveedorNombre: "Meta",
  proveedorGiro: "Publicidad",
  montoOriginal: 100,
  monedaOriginal: "USD",
  montoCLP: 95000,
  tasaCambio: 950,
  montoNeto: 0,
  montoExento: 95000,
  montoIva: 0,
  montoTotal: 95000,
  fechaEmision: "2026-06-01",
  numeroDocumento: "INV-123",
  concepto: "Meta Ads",
  detalle: "",
};

describe("gasto-idempotency", () => {
  it("buildGastoIdempotencyKey is deterministic", () => {
    const a = buildGastoIdempotencyKey("emp-1", sampleGasto);
    const b = buildGastoIdempotencyKey("emp-1", sampleGasto);
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  it("buildGastoIdempotencyKey differs by empresa", () => {
    const a = buildGastoIdempotencyKey("emp-1", sampleGasto);
    const b = buildGastoIdempotencyKey("emp-2", sampleGasto);
    expect(a).not.toBe(b);
  });

  it("findDuplicateGasto excludes rechazado_sii and filters numero_documento", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id: "gasto-1", estado: "facturado", factura_compra_id: "fc-1" },
    });

    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle,
    };

    const supabase = { from: vi.fn(() => chain) } as any;

    const match = await findDuplicateGasto(supabase, "emp-1", sampleGasto);

    expect(chain.neq).toHaveBeenCalledWith("estado", "rechazado_sii");
    expect(chain.eq).toHaveBeenCalledWith("numero_documento", "INV-123");
    expect(match?.id).toBe("gasto-1");
  });
});