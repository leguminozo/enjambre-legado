import { describe, it, expect } from "vitest";
import { parseReceipt } from "../domain/receipt-parsers";

const TASA = 950;

describe("receipt parsers — proveedores extendidos", () => {
  it("parsea invoice OpenAI", () => {
    const text = `
      OpenAI, LLC
      Invoice # INV-OAI-2026-042
      Amount due: USD 42.50
      API usage — March 2026
      Date: 2026-03-15
    `;
    const result = parseReceipt(text, undefined, TASA);
    expect(result).not.toBeNull();
    expect(result!.proveedorId).toBe("openai");
    expect(result!.montoOriginal).toBe(42.5);
    expect(result!.montoCLP).toBe(Math.round(42.5 * TASA));
    expect(result!.numeroDocumento).toContain("INV-OAI");
  });

  it("parsea invoice Google Workspace", () => {
    const text = `
      Google LLC — Google Workspace
      Invoice number: GW-2026-8812
      Total: USD 18.00
      Billing period March 2026
      2026-03-01
    `;
    const result = parseReceipt(text, undefined, TASA);
    expect(result).not.toBeNull();
    expect(result!.proveedorId).toBe("google-workspace");
    expect(result!.montoOriginal).toBe(18);
    expect(result!.concepto).toMatch(/Google Workspace/i);
  });

  it("parsea invoice Vercel", () => {
    const text = `
      Vercel Inc.
      Invoice # VER-99281
      Pro Plan — Amount: $20.00
      Billing date 2026-04-02
    `;
    const result = parseReceipt(text, undefined, TASA);
    expect(result).not.toBeNull();
    expect(result!.proveedorId).toBe("vercel");
    expect(result!.montoOriginal).toBe(20);
    expect(result!.fechaEmision).toBe("2026-04-02");
  });

  it("parsea invoice Notion", () => {
    const text = `
      Notion Labs, Inc.
      Invoice # NOT-77821
      Notion Plus subscription
      Amount due USD 10.00
      April 5, 2026
    `;
    const result = parseReceipt(text, undefined, TASA);
    expect(result).not.toBeNull();
    expect(result!.proveedorId).toBe("notion");
    expect(result!.montoOriginal).toBe(10);
    expect(result!.fechaEmision).toBe("2026-04-05");
  });

  it("parsea invoice Canva", () => {
    const text = `
      Canva Pty Ltd
      Invoice number CAN-55432
      Canva Pro subscription
      Total: USD 12.99
      2026-05-10
    `;
    const result = parseReceipt(text, undefined, TASA);
    expect(result).not.toBeNull();
    expect(result!.proveedorId).toBe("canva");
    expect(result!.montoOriginal).toBe(12.99);
    expect(result!.montoCLP).toBe(Math.round(12.99 * TASA));
  });
});