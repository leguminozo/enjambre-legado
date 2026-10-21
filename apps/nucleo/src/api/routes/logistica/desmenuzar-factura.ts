import { extractTextFromDocument, type FiscalDocumentMimeType } from "@enjambre/fiscal";
import { isAiEnabled, groqChatCompletion } from "@/api/lib/ai/groq";

export type LineaFacturaDesmenuzada = {
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  total: number;
};

export type FacturaDesmenuzada = {
  proveedor_nombre: string;
  proveedor_rut?: string | null;
  folio?: string | null;
  fecha?: string | null;
  monto_neto?: number | null;
  monto_total?: number | null;
  lineas: LineaFacturaDesmenuzada[];
  metodo_extraccion: "xml_dte" | "ia_groq" | "heuristica";
};

/**
 * Extractor determinista para DTE XML (formato oficial del SII de Chile).
 * Zero costo de tokens, 100% determinista y exacto.
 */
export function parseDteXml(xmlString: string): FacturaDesmenuzada | null {
  try {
    // Verificar si es un DTE o documento tributario
    if (!xmlString.includes("<DTE") && !xmlString.includes("<Documento") && !xmlString.includes("<Detalle>")) {
      return null;
    }

    const rutMatch = xmlString.match(/<RUTEmisor>([^<]+)<\/RUTEmisor>/i);
    const rznMatch = xmlString.match(/<RznSoc(?:Emisor)?>([^<]+)<\/RznSoc(?:Emisor)?>/i);
    const folioMatch = xmlString.match(/<Folio>([^<]+)<\/Folio>/i);
    const fechaMatch = xmlString.match(/<FchEmis>([^<]+)<\/FchEmis>/i);
    const netoMatch = xmlString.match(/<MntNeto>([^<]+)<\/MntNeto>/i);
    const totalMatch = xmlString.match(/<MntTotal>([^<]+)<\/MntTotal>/i);

    const lineas: LineaFacturaDesmenuzada[] = [];
    const detalleRegex = /<Detalle>([\s\S]*?)<\/Detalle>/gi;
    let match: RegExpExecArray | null;

    while ((match = detalleRegex.exec(xmlString)) !== null) {
      const block = match[1];
      const nmb = block.match(/<NmbItem>([^<]+)<\/NmbItem>/i)?.[1] ||
                  block.match(/<DscItem>([^<]+)<\/DscItem>/i)?.[1] ||
                  "Insumo";
      const qtyStr = block.match(/<QtyItem>([^<]+)<\/QtyItem>/i)?.[1];
      const prcStr = block.match(/<PrcItem>([^<]+)<\/PrcItem>/i)?.[1];
      const mntStr = block.match(/<MontoItem>([^<]+)<\/MontoItem>/i)?.[1];

      const cantidad = qtyStr ? parseFloat(qtyStr) : 1;
      const precioUnitario = prcStr ? Math.round(parseFloat(prcStr)) : 0;
      const total = mntStr ? Math.round(parseFloat(mntStr)) : Math.round(cantidad * precioUnitario);

      if (nombreValido(nmb)) {
        lineas.push({
          nombre: cleanText(nmb),
          cantidad: Math.max(1, cantidad),
          precio_unitario: Math.max(0, precioUnitario),
          total: Math.max(0, total),
        });
      }
    }

    return {
      proveedor_nombre: cleanText(rznMatch?.[1] || "Proveedor sin razón social"),
      proveedor_rut: rutMatch?.[1]?.trim() || null,
      folio: folioMatch?.[1]?.trim() || null,
      fecha: fechaMatch?.[1]?.trim() || null,
      monto_neto: netoMatch ? parseInt(netoMatch[1], 10) : null,
      monto_total: totalMatch ? parseInt(totalMatch[1], 10) : null,
      lineas,
      metodo_extraccion: "xml_dte",
    };
  } catch {
    return null;
  }
}

/**
 * Extractor inteligente mediante IA de Núcleo (Groq JSON mode).
 */
export async function parseWithAi(text: string): Promise<FacturaDesmenuzada | null> {
  if (!isAiEnabled()) return null;

  try {
    const prompt = `Eres un extractor de facturas de compra y guías de insumos apícolas/agroindustriales de Chile.
Analiza el siguiente texto de un documento de compra y extrae un JSON con la estructura:
{
  "proveedor_nombre": "Razón social o nombre de la empresa proveedora",
  "proveedor_rut": "RUT del emisor si aparece (ej. 76.123.456-7) o null",
  "folio": "Número de factura o guía (ej. 10482) o null",
  "fecha": "Fecha en formato YYYY-MM-DD o null",
  "monto_neto": número entero o null,
  "monto_total": número entero o null,
  "lineas": [
    {
      "nombre": "Descripción del insumo (ej. Frasco 500g, Tapa dorada, Caja kraft, etc.)",
      "cantidad": número positivo,
      "precio_unitario": precio unitario neto en CLP,
      "total": monto total de la línea en CLP
    }
  ]
}
Texto del documento:
"""
${text.slice(0, 4000)}
"""
Responde exclusivamente con el JSON sin bloques de código ni texto adicional.`;

    const res = await groqChatCompletion({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(res.text) as Partial<FacturaDesmenuzada>;
    if (!parsed.proveedor_nombre && (!parsed.lineas || parsed.lineas.length === 0)) {
      return null;
    }

    return {
      proveedor_nombre: cleanText(parsed.proveedor_nombre || "Proveedor extraído"),
      proveedor_rut: parsed.proveedor_rut || null,
      folio: parsed.folio ? String(parsed.folio) : null,
      fecha: parsed.fecha || null,
      monto_neto: parsed.monto_neto || null,
      monto_total: parsed.monto_total || null,
      lineas: (parsed.lineas || []).map((l) => ({
        nombre: cleanText(l.nombre),
        cantidad: Number(l.cantidad) || 1,
        precio_unitario: Number(l.precio_unitario) || 0,
        total: Number(l.total) || 0,
      })),
      metodo_extraccion: "ia_groq",
    };
  } catch {
    return null;
  }
}

/**
 * Extractor heurístico de respaldo (basado en regex para texto plano).
 */
export function parseHeuristicText(text: string): FacturaDesmenuzada {
  const rutMatch = text.match(/\b(\d{1,2}\.?\d{3}\.?\d{3}-[\dkK]|\d{7,8}-[\dkK])\b/);
  const folioMatch = text.match(/(?:Factura|Gu[ií]a|N[°ºo]|Folio)\s*(?:Electr[oó]nica)?\s*[:.#]?\s*(\d{2,10})/i);
  const fechaMatch = text.match(/\b(202\d-[01]\d-[0-3]\d|[0-3]\d\/[01]\d\/202\d)\b/);

  // Buscar líneas que tengan descripción + números (cantidad y precio)
  const lineas: LineaFacturaDesmenuzada[] = [];
  const rawLines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  for (const line of rawLines) {
    // Ejemplo: "Frasco vidrio hexagonal 500g 1000 380 380000" o "1000 Frasco 500g $380"
    const numbers = line.match(/\b\d{1,7}\b/g);
    if (numbers && numbers.length >= 2) {
      const nums = numbers.map(Number).filter((n) => n > 0 && n < 50_000_000);
      if (nums.length >= 2) {
        const textParts = line.replace(/\b\d+\b/g, "").replace(/[$.,]/g, "").trim();
        if (textParts.length >= 3 && nombreValido(textParts)) {
          const cantidad = nums[0];
          const precio = nums[1];
          lineas.push({
            nombre: cleanText(textParts),
            cantidad,
            precio_unitario: precio,
            total: cantidad * precio,
          });
        }
      }
    }
  }

  let fechaIso: string | null = null;
  if (fechaMatch) {
    const rawF = fechaMatch[1];
    if (rawF.includes("/")) {
      const [d, m, y] = rawF.split("/");
      fechaIso = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    } else {
      fechaIso = rawF;
    }
  }

  return {
    proveedor_nombre: "Proveedor detectado",
    proveedor_rut: rutMatch ? rutMatch[1].replace(/\./g, "") : null,
    folio: folioMatch ? folioMatch[1] : null,
    fecha: fechaIso,
    lineas,
    metodo_extraccion: "heuristica",
  };
}

/**
 * Orquestador principal de desmenuzamiento.
 */
export async function desmenuzarDocumento(
  fileName: string,
  mimeType: string,
  buffer: Buffer
): Promise<FacturaDesmenuzada> {
  // 1. DTE XML nativo chileno
  if (
    fileName.toLowerCase().endsWith(".xml") ||
    mimeType.includes("xml")
  ) {
    const xmlContent = buffer.toString("utf-8");
    const dte = parseDteXml(xmlContent);
    if (dte) return dte;
  }

  // 2. Extraer texto plano desde PDF o imagen
  let text: string;
  try {
    const isFiscalMime = (
      mimeType === "application/pdf" ||
      mimeType === "image/png" ||
      mimeType === "image/jpeg" ||
      mimeType === "image/webp"
    );

    if (isFiscalMime) {
      const extracted = await extractTextFromDocument(mimeType as FiscalDocumentMimeType, buffer);
      text = extracted || "";
    } else {
      text = buffer.toString("utf-8");
    }
  } catch {
    text = buffer.toString("utf-8");
  }

  // Si el texto parece contener XML aunque vino con extensión ambigua
  if (text.includes("<DTE") || text.includes("<Detalle>")) {
    const dte = parseDteXml(text);
    if (dte) return dte;
  }

  // 3. Extracción con IA si está habilitada
  if (text.trim().length > 15) {
    const aiResult = await parseWithAi(text);
    if (aiResult && aiResult.lineas.length > 0) {
      return aiResult;
    }
  }

  // 4. Extracción heurística de respaldo
  return parseHeuristicText(text);
}

function nombreValido(txt: string): boolean {
  const lower = txt.toLowerCase();
  if (lower.includes("iva") || lower.includes("total neto") || lower.includes("subtotal")) return false;
  if (lower.includes("rut") || lower.includes("dirección") || lower.includes("giro")) return false;
  return txt.length > 2;
}

function cleanText(txt: string): string {
  return txt.replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim();
}
