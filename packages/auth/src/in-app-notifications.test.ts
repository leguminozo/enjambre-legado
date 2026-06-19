import { describe, it, expect } from "vitest";
import {
  inferNotificationSeverity,
  mapInAppNotificationRow,
  resolveInAppHref,
} from "./in-app-notifications";

describe("in-app-notifications", () => {
  it("resolves tienda pedido href", () => {
    expect(resolveInAppHref("Pedido confirmado — ORD-1", "tienda")).toBe("/perfil/pedidos");
  });

  it("resolves nucleo despacho href", () => {
    expect(resolveInAppHref("Despacho en camino", "nucleo")).toBe("/operaciones");
  });

  it("infers warning severity for pedido", () => {
    expect(inferNotificationSeverity("Pedido confirmado", null)).toBe("warning");
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