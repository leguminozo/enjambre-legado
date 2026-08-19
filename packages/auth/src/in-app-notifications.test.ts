import { describe, it, expect } from "vitest";
import {
  assertHrefAllowedForRole,
  inferNotificationSeverity,
  mapInAppNotificationRow,
  resolveInAppHref,
} from "./in-app-notifications";

describe("in-app-notifications", () => {
  it("resolves tienda pedido href", () => {
    expect(resolveInAppHref("Pedido confirmado — ORD-1", "tienda")).toBe("/perfil/pedidos");
  });

  it("resolves nucleo despacho href", () => {
    expect(resolveInAppHref("Despacho en camino", "nucleo", { role: "admin" })).toBe(
      "/operaciones",
    );
  });

  it("never sends territorial beekeeper to admin operaciones", () => {
    expect(
      resolveInAppHref("Pedido confirmado — ORD-1", "nucleo", { role: "territorial" }),
    ).toBe("/inicio");
    expect(
      resolveInAppHref("Despacho en camino", "nucleo", {
        role: "territorial",
        category: "pedidos",
      }),
    ).toBe("/inicio");
  });

  it("sends territorial territorio alerts to the matching tool", () => {
    expect(
      resolveInAppHref("Alerta fitosanitaria en tu zona", "nucleo", {
        role: "territorial",
        category: "territorio",
      }),
    ).toBe("/territorio/alertas");
    expect(
      resolveInAppHref("Ingreso trashumante declarado", "nucleo", {
        role: "territorial",
        source: "trashumancia",
      }),
    ).toBe("/territorio/trashumancia");
    expect(
      resolveInAppHref("Censo actualizado", "nucleo", {
        role: "territorial",
        category: "territorio",
        source: "censo",
      }),
    ).toBe("/territorio");
  });

  it("infers warning severity for pedido", () => {
    expect(inferNotificationSeverity("Pedido confirmado", null)).toBe("warning");
  });

  it("blocks admin-only hrefs for territorial and patio", () => {
    expect(assertHrefAllowedForRole("/operaciones", "territorial")).toBe("/inicio");
    expect(assertHrefAllowedForRole("/sii", "apicultor")).toBe("/inicio");
    expect(assertHrefAllowedForRole("/operaciones", "admin")).toBe("/operaciones");
    expect(assertHrefAllowedForRole("/territorio", "territorial")).toBe("/territorio");
  });

  it("maps territorial pedido-looking subject away from gerencia", () => {
    const mapped = mapInAppNotificationRow(
      {
        id: "n2",
        channel: "in_app",
        subject: "Pedido confirmado",
        body: "pago",
        created_at: "2026-08-18T15:00:00Z",
        created_by: "u1",
        recipient: "a@b.com",
        status: "sent",
        provider_response: { category: "pedidos" },
      },
      "nucleo",
      { role: "territorial" },
    );
    expect(mapped.href).toBe("/inicio");
  });

  it("maps notification row for bell", () => {
    const mapped = mapInAppNotificationRow(
      {
        id: "n1",
        channel: "in_app",
        subject: "Bienvenido",
        body: "Hola",
        created_at: "2026-06-18T15:00:00Z",
        created_by: "u1",
        recipient: "a@b.com",
        status: "sent",
        provider_response: {},
      },
      "tienda",
    );
    expect(mapped.title).toBe("Bienvenido");
    expect(mapped.type).toBe("gold");
  });
});