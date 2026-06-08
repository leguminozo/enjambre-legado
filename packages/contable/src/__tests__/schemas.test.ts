import { describe, it, expect } from "vitest";
import { FacturaEmitidaInputSchema, FacturaEmitidaOutputSchema } from "../schemas/factura";
import { FacturaCompraInputSchema, FacturaCompraOutputSchema } from "../schemas/factura-compra";
import { DTE_TIPO } from "../domain/sii-dte";

describe("FacturaEmitidaInputSchema", () => {
  it("accepts valid input", () => {
    const result = FacturaEmitidaInputSchema.safeParse({
      numero: "FAC-001",
      fecha_emision: "2025-01-15T10:00:00Z",
      monto_neto: 100000,
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional fields", () => {
    const result = FacturaEmitidaInputSchema.safeParse({
      numero: "FAC-001",
      fecha_emision: "2025-01-15T10:00:00Z",
      monto_neto: 100000,
      tercero_id: "550e8400-e29b-41d4-a716-446655440000",
      descripcion: "Servicios consultivos",
      idempotency_key: "unique-key-123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty numero", () => {
    const result = FacturaEmitidaInputSchema.safeParse({
      numero: "  ",
      fecha_emision: "2025-01-15T10:00:00Z",
      monto_neto: 100000,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative monto_neto", () => {
    const result = FacturaEmitidaInputSchema.safeParse({
      numero: "FAC-001",
      fecha_emision: "2025-01-15T10:00:00Z",
      monto_neto: -500,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid ISO datetime", () => {
    const result = FacturaEmitidaInputSchema.safeParse({
      numero: "FAC-001",
      fecha_emision: "not-a-date",
      monto_neto: 100000,
    });
    expect(result.success).toBe(false);
  });
});

describe("FacturaEmitidaOutputSchema", () => {
  it("accepts valid output", () => {
    const result = FacturaEmitidaOutputSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      empresa_id: "550e8400-e29b-41d4-a716-446655440001",
      numero: "FAC-001",
      fecha_emision: "2025-01-15T10:00:00Z",
      monto_neto: 100000,
      monto_iva: 19000,
      monto_total: 119000,
      created_at: "2025-01-15T10:00:00Z",
    });
    expect(result.success).toBe(true);
  });
});

describe("FacturaCompraInputSchema", () => {
  it("accepts valid input with RUT", () => {
    const result = FacturaCompraInputSchema.safeParse({
      tercero_id: "550e8400-e29b-41d4-a716-446655440000",
      folio: 123,
      fecha_emision: "2025-01-15T10:00:00Z",
      monto_neto: 50000,
      receptor_rut: "11111111-1",
      receptor_razon_social: "Enjambre SpA",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid RUT", () => {
    const result = FacturaCompraInputSchema.safeParse({
      tercero_id: "550e8400-e29b-41d4-a716-446655440000",
      folio: 123,
      fecha_emision: "2025-01-15T10:00:00Z",
      monto_neto: 50000,
      receptor_rut: "76350040-1",
      receptor_razon_social: "Invalid RUT SA",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional referencias", () => {
    const result = FacturaCompraInputSchema.safeParse({
      tercero_id: "550e8400-e29b-41d4-a716-446655440000",
      folio: 123,
      fecha_emision: "2025-01-15T10:00:00Z",
      monto_neto: 50000,
      receptor_rut: "11111111-1",
      receptor_razon_social: "Enjambre SpA",
      referencias: [
        { tipoDocumento: 33, folio: 100, fecha: "2025-01-01", razonReferencia: "Anula" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("defaults monto_exento to 0", () => {
    const result = FacturaCompraInputSchema.safeParse({
      tercero_id: "550e8400-e29b-41d4-a716-446655440000",
      folio: 123,
      fecha_emision: "2025-01-15T10:00:00Z",
      monto_neto: 50000,
      receptor_rut: "11111111-1",
      receptor_razon_social: "Enjambre SpA",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.monto_exento).toBe(0);
    }
  });
});

describe("FacturaCompraOutputSchema", () => {
  it("accepts valid output", () => {
    const result = FacturaCompraOutputSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      empresa_id: "550e8400-e29b-41d4-a716-446655440001",
      tercero_id: "550e8400-e29b-41d4-a716-446655440002",
      tipo_dte: DTE_TIPO.FACTURA_COMPRA,
      folio: 123,
      fecha_emision: "2025-01-15",
      monto_neto: 50000,
      monto_exento: 0,
      monto_iva: 9500,
      monto_total: 59500,
      estado_sii: "pendiente",
      track_id: null,
      descripcion: null,
      created_at: "2025-01-15T10:00:00Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid estado_sii", () => {
    const result = FacturaCompraOutputSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      empresa_id: "550e8400-e29b-41d4-a716-446655440001",
      tercero_id: "550e8400-e29b-41d4-a716-446655440002",
      tipo_dte: DTE_TIPO.FACTURA_COMPRA,
      folio: 123,
      fecha_emision: "2025-01-15",
      monto_neto: 50000,
      monto_exento: 0,
      monto_iva: 9500,
      monto_total: 59500,
      estado_sii: "invalid_status",
      track_id: null,
      descripcion: null,
      created_at: "2025-01-15T10:00:00Z",
    });
    expect(result.success).toBe(false);
  });
});
