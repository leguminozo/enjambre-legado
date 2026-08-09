import { describe, expect, it, vi, afterEach } from "vitest";
import { createPublicKey, createVerify } from "node:crypto";
import forge from "node-forge";
import { buildRpetcJwt, getRpetcAccessToken, rpetcCrearTarea, rpetcEstadoTarea, rpetcResultadoTarea, rpetcEstados } from "./rpetc-api";
import { parseRpetcTokenResponse } from "@enjambre/contable";

function generarP12(commonName: string): { p12Base64: string; privateKeyPem: string; certPem: string } {
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = "01";
  cert.validity.notBefore = new Date(Date.now() - 86400000);
  cert.validity.notAfter = new Date(Date.now() + 86400000);
  const attrs = [{ name: "commonName", value: commonName }];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(keys.privateKey, forge.md.sha1.create());

  const p12Asn1 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert], "secreto", {
    algorithm: "3des",
  });
  const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
  return {
    p12Base64: forge.util.encode64(p12Der),
    privateKeyPem: forge.pki.privateKeyToPem(keys.privateKey),
    certPem: forge.pki.certificateToPem(cert),
  };
}

const material = generarP12("Certificado de Prueba Enjambre");
const AUD_CERT = "https://apicert.sii.cl/oauthsii-v1-ms/extauth/v1/token";

function b64urlToB64(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  return padded + "=".repeat((4 - (padded.length % 4)) % 4);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("buildRpetcJwt", () => {
  it("genera un JWT RS256 válido, verificable con el certificado del P12", () => {
    const jwt = buildRpetcJwt("8315495", AUD_CERT, material.p12Base64, "secreto");
    const [headerB64, payloadB64, sigB64] = jwt.split(".") as [string, string, string];

    const header = JSON.parse(Buffer.from(b64urlToB64(headerB64), "base64").toString("utf8")) as { alg: string; x5c: string };
    expect(header.alg).toBe("RS256");
    // x5c = certificado en DER base64 estándar (con padding)
    expect(header.x5c).toBe(Buffer.from(material.certPem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, ""), "base64").toString("base64"));

    const payload = JSON.parse(Buffer.from(b64urlToB64(payloadB64), "base64").toString("utf8")) as { aio: string; exp: number; aud: string };
    expect(payload.aio).toBe("8315495");
    expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    expect(payload.exp).toBeLessThanOrEqual(Math.floor(Date.now() / 1000) + 610);
    expect(payload.aud).toBe(AUD_CERT);

    // Verificación criptográfica de la firma contra el certificado
    const verifier = createVerify("RSA-SHA256");
    verifier.update(`${headerB64}.${payloadB64}`, "utf8");
    verifier.end();
    const publicKey = createPublicKey({ key: material.certPem, format: "pem" });
    expect(verifier.verify(publicKey, Buffer.from(b64urlToB64(sigB64), "base64"))).toBe(true);
  });
});

describe("getRpetcAccessToken", () => {
  it("solicita el token con grant_type=cert_credentials, scope y JWT, y Basic auth", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: "31ad0f2f-72b4-4685-a041-b0d13f4d949f",
        token_type: "Bearer",
        expires_in: 1763040967,
        refresh_token: "b11b9b1d-3a34-4cdf-a602-ea0b9f3c1c3b",
        scope: "RTC_TAR RTC_PRO_RES RTC_PRO_TOD RTC_PRO_PER RTC_PRO_EST",
      }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const jwt = buildRpetcJwt("8315495", AUD_CERT, material.p12Base64, "secreto");
    const result = await getRpetcAccessToken("CERTIFICACION", { clientId: "client-1", clientSecret: "secret-1" }, jwt);

    expect(result.accessToken).toBe("31ad0f2f-72b4-4685-a041-b0d13f4d949f");
    expect(result.refreshToken).toBe("b11b9b1d-3a34-4cdf-a602-ea0b9f3c1c3b");

    const url = fetchMock.mock.calls[0]![0] as string;
    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    expect(url).toBe("https://apicert.sii.cl/oauthsii-v1-ms/extauth/v1/token");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe(`Basic ${Buffer.from("client-1:secret-1").toString("base64")}`);
    const body = String(init.body);
    expect(body).toContain("grant_type=cert_credentials");
    expect(body).toContain(encodeURIComponent("RTC_TAR RTC_PRO_RES RTC_PRO_TOD RTC_PRO_PER RTC_PRO_EST"));
    expect(body).toContain(`jwt=${encodeURIComponent(jwt)}`);
  });

  it("renueva con grant_type=refresh_token en el endpoint de authorization", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: "a6e4672c-a5e5-4081-9788-5fbb5ca4d2ba",
        token_type: "Bearer",
        expires_in: 1761920771,
        refresh_token: "81bea8b5-c43a-4eac-b4f9-59cd858c591a",
      }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await getRpetcAccessToken("PRODUCCION", { clientId: "c", clientSecret: "s" }, "refresh-old", "refresh_token");
    expect(result.accessToken).toBe("a6e4672c-a5e5-4081-9788-5fbb5ca4d2ba");

    const url = fetchMock.mock.calls[0]![0] as string;
    const body = String((fetchMock.mock.calls[0]![1] as RequestInit).body);
    expect(url).toBe("https://api.sii.cl/oauthsii-v1-ms/authorization/v1/token");
    expect(body).toContain("grant_type=refresh_token");
    expect(body).toContain("refresh_token=refresh-old");
  });

  it("lanza con error descriptivo si la respuesta no trae access_token", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ error: "invalid_grant" }),
    }) as unknown as typeof fetch;

    await expect(getRpetcAccessToken("CERTIFICACION", { clientId: "c", clientSecret: "s" }, "jwt"))
      .rejects.toThrow("sin access_token");
  });
});

describe("tareas asincrónicas de la API-RPETC", () => {
  it("cesiones usa GET y certificados usa POST, ambos con Bearer", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ idTarea: "t-1", estado: "RECIBIDA" }) });
    global.fetch = fetchMock as unknown as typeof fetch;

    const cesiones = await rpetcCrearTarea("CERTIFICACION", "tok", "8315495", "0", "cesiones", "deudor");
    expect(cesiones["idTarea"]).toBe("t-1");
    let url = fetchMock.mock.calls[0]![0] as string;
    let init = fetchMock.mock.calls[0]![1] as RequestInit;
    expect(url).toBe("https://apicert.sii.cl/api/api-rpetc/recurso/v1/tarea/8315495-0/cesiones.deudor");
    expect(init.method).toBe("GET");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok");

    const certificados = await rpetcCrearTarea("CERTIFICACION", "tok", "8315495", "0", "certificados", "cedente", { periodo: "2026-08" });
    expect(certificados["estado"]).toBe("RECIBIDA");
    url = fetchMock.mock.calls[1]![0] as string;
    init = fetchMock.mock.calls[1]![1] as RequestInit;
    expect(url).toContain("/certificados.cesiones.cedente");
    expect(init.method).toBe("POST");
    expect(String(init.body)).toContain('"periodo":"2026-08"');
  });

  it("consulta estado, resultado y estados por período", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ estado: "TERMINADA" }) });
    global.fetch = fetchMock as unknown as typeof fetch;

    await rpetcEstadoTarea("CERTIFICACION", "tok", "8315495", "0", "t-1");
    await rpetcResultadoTarea("CERTIFICACION", "tok", "8315495", "0", "t-1");
    await rpetcEstados("CERTIFICACION", "tok", "8315495", "0", "2026-08");

    const urls = fetchMock.mock.calls.map((call) => call[0] as string);
    expect(urls[0]).toContain("/estado/8315495-0/t-1");
    expect(urls[1]).toContain("/resultado/8315495-0/t-1");
    expect(urls[2]).toContain("/estados/8315495-0/periodo/2026-08");
  });
});

// parseRpetcTokenResponse ya está cubierto en contable; se importa para
// asegurar la re-exportación del tipo desde @enjambre/contable
void parseRpetcTokenResponse;
