import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("fetchTasaCambio", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("fetches and parses tasa from mindicador.cl", async () => {
    const mockResponse = {
      codigo: "dolar",
      nombre: "Dolar",
      serie: [{ fecha: "2025-06-01T00:00:00Z", valor: 850.5 }],
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    }));

    const { fetchTasaCambio } = await import("../domain/tasa-cambio");
    const tasa = await fetchTasaCambio("dolar");
    expect(tasa.moneda).toBe("dolar");
    expect(tasa.valor).toBe(850.5);
    expect(tasa.fuente).toBe("mindicador.cl");
  });

  it("throws on non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }));

    const { fetchTasaCambio } = await import("../domain/tasa-cambio");
    await expect(fetchTasaCambio("dolar")).rejects.toThrow("Error obteniendo tasa de cambio: 500");
  });

  it("throws when serie is empty", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ codigo: "dolar", serie: [] }),
    }));

    const { fetchTasaCambio } = await import("../domain/tasa-cambio");
    await expect(fetchTasaCambio("dolar")).rejects.toThrow("No hay datos de tasa para dolar");
  });

  it("uses cache on second call", async () => {
    const mockResponse = {
      codigo: "dolar",
      nombre: "Dolar",
      serie: [{ fecha: "2025-06-01T00:00:00Z", valor: 850.5 }],
    };
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });
    vi.stubGlobal("fetch", fetchSpy);

    const { fetchTasaCambio } = await import("../domain/tasa-cambio");
    await fetchTasaCambio("dolar");
    await fetchTasaCambio("dolar");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("fetches with fecha parameter", async () => {
    const mockResponse = {
      codigo: "dolar",
      nombre: "Dolar",
      serie: [{ fecha: "2025-05-15T00:00:00Z", valor: 840.0 }],
    };
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });
    vi.stubGlobal("fetch", fetchSpy);

    const { fetchTasaCambio } = await import("../domain/tasa-cambio");
    const tasa = await fetchTasaCambio("dolar", "2025-05-15");
    expect(tasa.valor).toBe(840.0);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://mindicador.cl/api/dolar/2025-05-15",
    );
  });
});

describe("fetchTasaDolar", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("returns numeric value", async () => {
    const mockResponse = {
      codigo: "dolar",
      nombre: "Dolar",
      serie: [{ fecha: "2025-06-01T00:00:00Z", valor: 860.0 }],
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    }));

    const { fetchTasaDolar } = await import("../domain/tasa-cambio");
    const valor = await fetchTasaDolar();
    expect(valor).toBe(860.0);
  });
});

describe("fetchTasaEuro", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("returns numeric value", async () => {
    const mockResponse = {
      codigo: "euro",
      nombre: "Euro",
      serie: [{ fecha: "2025-06-01T00:00:00Z", valor: 950.0 }],
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    }));

    const { fetchTasaEuro } = await import("../domain/tasa-cambio");
    const valor = await fetchTasaEuro();
    expect(valor).toBe(950.0);
  });
});
