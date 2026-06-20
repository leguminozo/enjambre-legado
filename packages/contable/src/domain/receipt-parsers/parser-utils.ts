export function parseUsdAmount(raw: string): number {
  return parseFloat(raw.replace(/[,$]/g, ""));
}

export function parseEurAmount(raw: string): number {
  return parseFloat(raw.replace(/[.,]/g, (m, offset, str) => {
    const lastComma = str.lastIndexOf(",");
    const lastDot = str.lastIndexOf(".");
    if (lastComma > lastDot) return offset === lastComma ? "." : "";
    return m === "," ? "" : m;
  }));
}

export function extractDate(text: string): string {
  const isoMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];

  const monthMatch = text.match(/(\w{3,9})\s+(\d{1,2}),?\s+(\d{4})/);
  if (monthMatch) {
    const months: Record<string, string> = {
      january: "01", february: "02", march: "03", april: "04",
      may: "05", june: "06", july: "07", august: "08",
      september: "09", october: "10", november: "11", december: "12",
      jan: "01", feb: "02", mar: "03", apr: "04",
      jun: "06", jul: "07", aug: "08", sep: "09",
      oct: "10", nov: "11", dec: "12",
    };
    const m = months[monthMatch[1].toLowerCase()];
    if (m) return `${monthMatch[3]}-${m}-${monthMatch[2].padStart(2, "0")}`;
  }

  return new Date().toISOString().slice(0, 10);
}

export function buildMontos(
  montoCLP: number,
  conIva: boolean,
): { montoNeto: number; montoExento: number; montoIva: number } {
  if (conIva) {
    const montoNeto = Math.round(montoCLP / 1.19);
    return { montoNeto, montoExento: 0, montoIva: montoCLP - montoNeto };
  }
  return { montoNeto: 0, montoExento: montoCLP, montoIva: 0 };
}