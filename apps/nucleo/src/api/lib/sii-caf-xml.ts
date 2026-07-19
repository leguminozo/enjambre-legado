/**
 * Parse SII CAF / AUTORIZACION XML (text) into DB-ready fields.
 * Tolerates minor whitespace; does not validate cryptographic FRMA.
 */

export type ParsedCaf = {
  tipo_dte: number;
  folio_desde: number;
  folio_hasta: number;
  folio_actual: number;
  fecha_autorizacion: string;
  firma_caf: string;
  private_key: string;
  public_key: string;
  nro_resol: number;
  fch_resol: string;
  rut_emisor?: string;
};

function tag(xml: string, name: string): string | null {
  const re = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i");
  const m = xml.match(re);
  return m ? m[1].trim() : null;
}

function tagCdataOrText(xml: string, name: string): string | null {
  const raw = tag(xml, name);
  if (!raw) return null;
  return raw.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim();
}

export function parseCafXml(xmlRaw: string): { ok: true; caf: ParsedCaf } | { ok: false; message: string } {
  const xml = xmlRaw?.trim();
  if (!xml || !xml.includes("<")) {
    return { ok: false, message: "XML CAF vacío o inválido" };
  }

  const td = tag(xml, "TD");
  const d = tag(xml, "D");
  const h = tag(xml, "H");
  const fa = tag(xml, "FA");
  const frma = tagCdataOrText(xml, "FRMA");
  const rsask = tagCdataOrText(xml, "RSASK");
  const rsapubk = tagCdataOrText(xml, "RSAPUBK");
  const re = tag(xml, "RE");

  if (!td || !d || !h || !fa) {
    return {
      ok: false,
      message: "CAF incompleto: faltan TD, RNG (D/H) o FA",
    };
  }
  if (!frma) {
    return { ok: false, message: "CAF sin FRMA (firma)" };
  }
  if (!rsask || !rsapubk) {
    return {
      ok: false,
      message: "CAF sin RSASK/RSAPUBK (claves). Use el archivo AUTORIZACION completo del SII.",
    };
  }

  const tipo = Number(td);
  const desde = Number(d);
  const hasta = Number(h);
  if (!Number.isFinite(tipo) || !Number.isFinite(desde) || !Number.isFinite(hasta) || desde > hasta) {
    return { ok: false, message: "Rangos de folio o tipo DTE inválidos" };
  }

  // Optional resolution metadata (some CAF exports include IDK / RES)
  const nroResolRaw = tag(xml, "IDK") ?? tag(xml, "NRO_RESOL") ?? "0";
  const fchResol = tag(xml, "FCH_RESOL") ?? fa;

  return {
    ok: true,
    caf: {
      tipo_dte: tipo,
      folio_desde: desde,
      folio_hasta: hasta,
      folio_actual: desde, // next folio to use = desde (sii_caf_next_folio increments first)
      fecha_autorizacion: fa.slice(0, 10),
      firma_caf: frma,
      private_key: rsask,
      public_key: rsapubk,
      nro_resol: Number.parseInt(nroResolRaw, 10) || 0,
      fch_resol: fchResol.slice(0, 10),
      rut_emisor: re ?? undefined,
    },
  };
}
