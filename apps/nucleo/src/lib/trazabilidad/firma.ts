import { createAdminClient } from "@enjambre/auth/browser";
import { createHash } from "crypto";

interface SignatureResult {
  success: boolean;
  signatureHash: string;
  timestamp: string;
}

/**
 * Calcular el hash SHA-256 de un payload de datos ordenando las llaves para asegurar determinismo
 */
export function calculatePayloadHash(payload: Record<string, any>): string {
  const serialized = JSON.stringify(
    Object.keys(payload)
      .sort()
      .reduce((acc, key) => {
        acc[key] = payload[key];
        return acc;
      }, {} as Record<string, any>)
  );
  return createHash("sha256").update(serialized).digest("hex");
}

/**
 * Firmar criptográficamente un lote o colmena en Postgres
 * Guarda la firma en blockchain_anchors (que funciona como el registro de auditoría local)
 * y actualiza la columna correspondiente con el hash generado.
 */
export async function signAndRegisterEntity(
  empresaId: string,
  entityType: "lote" | "colmena" | "inspeccion",
  entityId: string,
  payload: Record<string, any>
): Promise<SignatureResult> {
  const supabase = createAdminClient();
  if (!supabase) {
    throw new Error("[Trazabilidad Firma] No se pudo inicializar Supabase Admin");
  }

  // 1. Calcular el hash del payload
  const hash = calculatePayloadHash(payload);
  const signatureHash = `0x${hash}`;
  const timestamp = new Date().toISOString();

  console.log(`[Trazabilidad Firma] Generado Hash SHA-256 para ${entityType} ${entityId}: ${signatureHash}`);

  // 2. Registrar en blockchain_anchors (sirviendo de tabla de auditoría inmutable)
  const { error: anchorError } = await supabase.from("blockchain_anchors").insert({
    empresa_id: empresaId,
    entity_type: entityType,
    entity_id: entityId,
    tx_hash: signatureHash, // Guardamos el hash de la firma en la columna tx_hash
    chain: "local-postgres-audit", // Indicamos que es auditoría local Postgres
    block_number: 1, // Fijo para firmas locales
    block_timestamp: timestamp,
    merkle_proof: {
      payload_hash: signatureHash,
      root: signatureHash,
      leaves: [signatureHash],
    },
    metadata: {
      signature_version: "1.0",
      signer: "Enjambre Legado System Signer",
      payload_keys: Object.keys(payload),
    },
  });

  if (anchorError) {
    console.error("[Trazabilidad Firma] Error al registrar firma en DB:", anchorError.message);
    throw new Error(`DB Signature Ingestion Failed: ${anchorError.message}`);
  }

  // 3. Actualizar la columna blockchain_hash en la tabla correspondiente para compatibilidad
  let updateTable = "";
  if (entityType === "lote") updateTable = "lotes";
  else if (entityType === "colmena") updateTable = "colmenas";
  else if (entityType === "inspeccion") updateTable = "inspecciones";

  if (updateTable) {
    const { error: updateError } = await supabase
      .from(updateTable)
      .update({ blockchain_hash: signatureHash })
      .eq("id", entityId);

    if (updateError) {
      console.error(`[Trazabilidad Firma] Error al actualizar ${updateTable}.blockchain_hash:`, updateError.message);
    } else {
      console.log(`[Trazabilidad Firma] Actualizado exitosamente ${updateTable}.blockchain_hash con ${signatureHash}`);
    }
  }

  return {
    success: true,
    signatureHash,
    timestamp,
  };
}
