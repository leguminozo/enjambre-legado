import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { AppVariables } from "@/api/lib/middleware";
import { encryptSiiSecret, resolveSiiEncryptionKeyBytes } from "@/api/lib/sii-crypto";

const CertificadoUploadSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  vigencia_inicio: z.string().min(8),
  vigencia_fin: z.string().min(8),
  p12_base64: z.string().min(20, "Archivo P12 (base64) requerido"),
  p12_password: z.string().min(1, "Contraseña del P12 requerida"),
  activar: z.boolean().optional().default(true),
});

const CertificadoUpdateSchema = z.object({
  nombre: z.string().optional(),
  vigencia_inicio: z.string().optional(),
  vigencia_fin: z.string().optional(),
  activo: z.boolean().optional(),
});

export const certificadosRoutes = new Hono<{ Variables: AppVariables }>();

const CERT_PUBLIC =
  "id, nombre, vigencia_inicio, vigencia_fin, activo, created_at, updated_at, storage_path";

certificadosRoutes.post(
  "/upload",
  zValidator("json", CertificadoUploadSchema),
  async (c) => {
    try {
      const input = c.req.valid("json");
      const empresaId = c.get("empresaId");
      const supabase = c.get("supabase");

      if (!resolveSiiEncryptionKeyBytes()) {
        return c.json(
          {
            code: "encryption_key_missing",
            message:
              "Falta SII_CLAVE_ENCRYPTION_KEY (o SERVICE_ROLE ≥32). No se guarda la contraseña P12 en claro.",
          },
          503,
        );
      }

      const encryptedPass = await encryptSiiSecret(input.p12_password);
      if (!encryptedPass) {
        return c.json({ code: "encryption_failed", message: "No se pudo cifrar la contraseña P12" }, 503);
      }

      const inicio = new Date(input.vigencia_inicio);
      const fin = new Date(input.vigencia_fin);
      const hoy = new Date();

      if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime()) || inicio > fin) {
        return c.json({ code: "fechas_invalidas", message: "Rango de vigencia inválido" }, 400);
      }
      if (fin < hoy) {
        return c.json({ code: "certificado_expirado", message: "La vigencia fin no puede estar en el pasado" }, 400);
      }

      // Decode base64 → binary for storage
      let binary: Uint8Array;
      try {
        const cleaned = input.p12_base64.replace(/^data:[^;]+;base64,/, "");
        binary = Uint8Array.from(atob(cleaned), (ch) => ch.charCodeAt(0));
      } catch {
        return c.json({ code: "invalid_base64", message: "p12_base64 no es base64 válido" }, 400);
      }

      if (input.activar !== false) {
        await supabase
          .from("sii_certificados")
          .update({ activo: false })
          .eq("empresa_id", empresaId)
          .eq("activo", true);
      }

      const fileName = `${empresaId}/${input.nombre.replace(/[^a-zA-Z0-9_-]/g, "_")}_${Date.now()}.p12`;
      const { error: uploadError } = await supabase.storage
        .from("sii-certificados")
        .upload(fileName, binary, {
          contentType: "application/x-pkcs12",
          upsert: false,
        });

      if (uploadError) {
        return c.json(
          { code: "upload_failed", message: `Error al subir certificado: ${uploadError.message}` },
          500,
        );
      }

      const { data: certData, error: certError } = await supabase
        .from("sii_certificados")
        .insert({
          empresa_id: empresaId,
          nombre: input.nombre,
          storage_path: fileName,
          vigencia_inicio: input.vigencia_inicio.slice(0, 10),
          vigencia_fin: input.vigencia_fin.slice(0, 10),
          activo: input.activar !== false,
          p12_password_encriptada: encryptedPass,
        })
        .select(CERT_PUBLIC)
        .single();

      if (certError) {
        await supabase.storage.from("sii-certificados").remove([fileName]);
        return c.json(
          { code: "certificado_creation_failed", message: certError.message },
          500,
        );
      }

      return c.json(
        {
          success: true,
          message: "Certificado subido correctamente",
          data: { ...certData, has_password: true },
        },
        201,
      );
    } catch (error) {
      console.error("[SII Certificados Upload] Error:", error);
      return c.json(
        {
          code: "upload_error",
          message: error instanceof Error ? error.message : "Error inesperado al subir certificado",
        },
        500,
      );
    }
  },
);

certificadosRoutes.get("/", async (c) => {
  try {
    const empresaId = c.get("empresaId");
    const supabase = c.get("supabase");

    const { data: certs, error } = await supabase
      .from("sii_certificados")
      .select("id, nombre, vigencia_inicio, vigencia_fin, activo, created_at, updated_at, p12_password_encriptada")
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false });

    if (error) {
      return c.json({ code: "list_failed", message: error.message }, 500);
    }

    const certsConEstado = (certs ?? []).map((cert) => {
      const hoy = new Date();
      const inicio = new Date(cert.vigencia_inicio);
      const fin = new Date(cert.vigencia_fin);
      let estado: string;
      if (!cert.activo) estado = "inactivo";
      else if (hoy < inicio) estado = "no_vigente";
      else if (hoy > fin) estado = "expirado";
      else estado = "vigente";

      const { p12_password_encriptada: passEnc, ...rest } = cert as typeof cert & {
        p12_password_encriptada?: string | null;
      };

      return {
        ...rest,
        estado,
        has_password: Boolean(passEnc),
        dias_para_vencer:
          cert.activo && hoy <= fin
            ? Math.ceil((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
            : null,
      };
    });

    return c.json({ data: certsConEstado });
  } catch (error) {
    console.error("[SII Certificados List] Error:", error);
    return c.json(
      {
        code: "list_error",
        message: error instanceof Error ? error.message : "Error inesperado al listar certificados",
      },
      500,
    );
  }
});

certificadosRoutes.get("/:id", async (c) => {
  try {
    const certId = c.req.param("id");
    const empresaId = c.get("empresaId");
    const supabase = c.get("supabase");

    const { data: cert, error } = await supabase
      .from("sii_certificados")
      .select(CERT_PUBLIC)
      .eq("id", certId)
      .eq("empresa_id", empresaId)
      .single();

    if (error || !cert) {
      return c.json({ code: "not_found", message: "Certificado no encontrado" }, 404);
    }

    return c.json({ data: cert });
  } catch (error) {
    console.error("[SII Certificados Get] Error:", error);
    return c.json(
      {
        code: "get_error",
        message: error instanceof Error ? error.message : "Error inesperado",
      },
      500,
    );
  }
});

certificadosRoutes.patch(
  "/:id",
  zValidator("json", CertificadoUpdateSchema),
  async (c) => {
    try {
      const certId = c.req.param("id");
      const empresaId = c.get("empresaId");
      const input = c.req.valid("json");
      const supabase = c.get("supabase");

      if (input.activo === true) {
        await supabase
          .from("sii_certificados")
          .update({ activo: false })
          .eq("empresa_id", empresaId)
          .eq("activo", true)
          .neq("id", certId);
      }

      const { data: certData, error: updateError } = await supabase
        .from("sii_certificados")
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq("id", certId)
        .eq("empresa_id", empresaId)
        .select(CERT_PUBLIC)
        .single();

      if (updateError || !certData) {
        return c.json(
          { code: "update_failed", message: updateError?.message ?? "No encontrado" },
          updateError ? 500 : 404,
        );
      }

      return c.json({ success: true, data: certData });
    } catch (error) {
      console.error("[SII Certificados Update] Error:", error);
      return c.json(
        {
          code: "update_error",
          message: error instanceof Error ? error.message : "Error inesperado",
        },
        500,
      );
    }
  },
);

certificadosRoutes.post("/:id/activar", async (c) => {
  const certId = c.req.param("id");
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");

  await supabase
    .from("sii_certificados")
    .update({ activo: false })
    .eq("empresa_id", empresaId)
    .eq("activo", true)
    .neq("id", certId);

  const { data, error } = await supabase
    .from("sii_certificados")
    .update({ activo: true, updated_at: new Date().toISOString() })
    .eq("id", certId)
    .eq("empresa_id", empresaId)
    .select(CERT_PUBLIC)
    .single();

  if (error || !data) {
    return c.json({ code: "not_found", message: error?.message ?? "Certificado no encontrado" }, 404);
  }
  return c.json({ data });
});

certificadosRoutes.post("/:id/desactivar", async (c) => {
  const certId = c.req.param("id");
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");

  const { data, error } = await supabase
    .from("sii_certificados")
    .update({ activo: false, updated_at: new Date().toISOString() })
    .eq("id", certId)
    .eq("empresa_id", empresaId)
    .select(CERT_PUBLIC)
    .single();

  if (error || !data) {
    return c.json({ code: "not_found", message: error?.message ?? "Certificado no encontrado" }, 404);
  }
  return c.json({ data });
});

certificadosRoutes.delete("/:id", async (c) => {
  try {
    const certId = c.req.param("id");
    const empresaId = c.get("empresaId");
    const supabase = c.get("supabase");

    const { data: certData, error: certError } = await supabase
      .from("sii_certificados")
      .select("storage_path")
      .eq("id", certId)
      .eq("empresa_id", empresaId)
      .single();

    if (certError || !certData) {
      return c.json({ code: "not_found", message: "Certificado no encontrado" }, 404);
    }

    const { error: deleteError } = await supabase
      .from("sii_certificados")
      .delete()
      .eq("id", certId)
      .eq("empresa_id", empresaId);

    if (deleteError) {
      return c.json({ code: "delete_failed", message: deleteError.message }, 500);
    }

    if (certData.storage_path) {
      await supabase.storage.from("sii-certificados").remove([certData.storage_path]);
    }

    return c.json({ success: true, message: "Certificado eliminado" });
  } catch (error) {
    console.error("[SII Certificados Delete] Error:", error);
    return c.json(
      {
        code: "delete_error",
        message: error instanceof Error ? error.message : "Error inesperado",
      },
      500,
    );
  }
});

export default certificadosRoutes;
