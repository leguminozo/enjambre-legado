import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  enqueueTransactionalNotification,
  isShippedStatus,
  notifyCafLowFolios,
  notifyCheckoutConfirmed,
} from "./enqueue-transactional";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@enjambre/auth/notification-preferences";

function makeAdminMock(handlers: Record<string, () => unknown>) {
  const from = vi.fn((table: string) => {
    const handler = handlers[table];
    if (!handler) {
      throw new Error(`Unexpected table: ${table}`);
    }
    return handler();
  });
  return { from } as any;
}

function makeChain(finalValue: unknown) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = ["select", "eq", "filter", "limit", "insert", "maybeSingle"];
  for (const method of methods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }
  chain.maybeSingle = vi.fn().mockResolvedValue(finalValue);
  chain.insert = vi.fn().mockResolvedValue({ error: null });
  return chain;
}

describe("enqueue-transactional", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("isShippedStatus recognizes dispatch states", () => {
    expect(isShippedStatus("enviado")).toBe(true);
    expect(isShippedStatus("En tránsito")).toBe(true);
    expect(isShippedStatus("pendiente")).toBe(false);
  });

  it("skips when dedupe_key already exists in queue", async () => {
    const queueChain = makeChain({ data: { id: "existing" }, error: null });
    const admin = makeAdminMock({
      notification_queue: () => queueChain,
    });

    const result = await enqueueTransactionalNotification(admin, {
      dedupeKey: "checkout_paid:ORD-1",
      source: "checkout_paid",
      email: "buyer@example.com",
      userId: "user-1",
      subject: "Pedido confirmado",
      body: "Gracias",
    });

    expect(result.skipped).toBe(true);
    expect(result.emailQueued).toBe(false);
    expect(queueChain.insert).not.toHaveBeenCalled();
  });

  it("queues email and creates in_app event", async () => {
    let queueCalls = 0;
    const queueChain = makeChain({ data: null, error: null });
    queueChain.maybeSingle = vi.fn().mockImplementation(() => {
      queueCalls += 1;
      return Promise.resolve({ data: null, error: null });
    });

    const eventsChain = makeChain({ data: null, error: null });
    const profilesChain = makeChain({
      data: { notification_preferences: DEFAULT_NOTIFICATION_PREFERENCES },
      error: null,
    });

    const admin = makeAdminMock({
      notification_queue: () => queueChain,
      notification_events: () => eventsChain,
      profiles: () => profilesChain,
    });

    const result = await enqueueTransactionalNotification(admin, {
      dedupeKey: "checkout_paid:ORD-2",
      source: "checkout_paid",
      email: "buyer@example.com",
      userId: "user-2",
      subject: "Pedido confirmado — ORD-2",
      body: "Tu pago fue procesado",
    });

    expect(result.skipped).toBe(false);
    expect(result.emailQueued).toBe(true);
    expect(result.inAppCreated).toBe(true);
    expect(queueChain.insert).toHaveBeenCalledTimes(1);
    expect(eventsChain.insert).toHaveBeenCalledTimes(1);
    expect(queueCalls).toBeGreaterThanOrEqual(1);
  });

  it("records preference skip when both channels are disabled", async () => {
    const queueChain = makeChain({ data: null, error: null });
    const profilesChain = makeChain({
      data: {
        notification_preferences: {
          pedidos: { in_app: false, email: false },
          floracion: { in_app: true, email: true },
          sistema: { in_app: true, email: true },
        },
      },
      error: null,
    });

    const admin = makeAdminMock({
      notification_queue: () => queueChain,
      profiles: () => profilesChain,
    });

    const result = await enqueueTransactionalNotification(admin, {
      dedupeKey: "checkout_paid:ORD-3",
      source: "checkout_paid",
      email: "buyer@example.com",
      userId: "user-3",
      subject: "Pedido confirmado — ORD-3",
      body: "Tu pago fue procesado",
    });

    expect(result.preferenceSkipped).toBe(true);
    expect(result.emailQueued).toBe(false);
    expect(result.inAppCreated).toBe(false);
    expect(queueChain.insert).toHaveBeenCalledTimes(1);
    const insertArg = queueChain.insert.mock.calls[0]?.[0];
    expect(insertArg.status).toBe("sent");
    expect(insertArg.metadata.skipped_preferences).toBe(true);
  });

  it("notifyCheckoutConfirmed builds subject with buy order", async () => {
    const queueChain = makeChain({ data: null, error: null });
    const eventsChain = makeChain({ data: null, error: null });
    const profilesChain = makeChain({
      data: { notification_preferences: DEFAULT_NOTIFICATION_PREFERENCES },
      error: null,
    });
    const admin = makeAdminMock({
      notification_queue: () => queueChain,
      notification_events: () => eventsChain,
      profiles: () => profilesChain,
    });

    await notifyCheckoutConfirmed(admin, {
      buyOrder: "ORD-ABC",
      ventaId: "venta-1",
      total: 19900,
      trackingCode: "OYZ-ABC123",
      email: "buyer@example.com",
      userId: "user-3",
    });

    expect(queueChain.insert).toHaveBeenCalled();
    const insertArg = queueChain.insert.mock.calls[0]?.[0];
    expect(insertArg.subject).toContain("ORD-ABC");
    expect(insertArg.body).toContain("OYZ-ABC123");
  });

  it("notifyCafLowFolios uses caf dedupe key and sistema category", async () => {
    const queueChain = makeChain({ data: null, error: null });
    const eventsChain = makeChain({ data: null, error: null });
    const profilesChain = makeChain({
      data: { notification_preferences: DEFAULT_NOTIFICATION_PREFERENCES },
      error: null,
    });
    const admin = makeAdminMock({
      notification_queue: () => queueChain,
      notification_events: () => eventsChain,
      profiles: () => profilesChain,
    });

    await notifyCafLowFolios(admin, {
      empresaId: "emp-1",
      empresaNombre: "OYZ SpA",
      tipoDte: 46,
      foliosRestantes: 12,
      folioDesde: 1,
      folioHasta: 100,
      cafId: "caf-1",
      email: "fiscal@oyz.cl",
      userId: "user-1",
    });

    expect(queueChain.insert).toHaveBeenCalled();
    const insertArg = queueChain.insert.mock.calls[0]?.[0];
    expect(insertArg.metadata.dedupe_key).toBe("caf_alert_low:emp-1:46:caf-1");
    expect(insertArg.metadata.source).toBe("caf_low_folios");
    expect(insertArg.subject).toContain("12 folios");
  });
});