import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { AppVariables } from "@/api/lib/middleware";
import { createClient } from "@supabase/supabase-js";

// Esquemas de validación
const CertificadoUploadSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  vigencia_inicio: z.string().date(),
  vigencia_fin: z.string().date(),
});

// Esquema para actualización
const CertificadoUpdateSchema = z.object({
  nombre: z.string().optional(),
  vigencia_inicio: z.string().date().optional(),
  vigencia_fin: z.string().date().optional(),
  activo: z.boolean().optional(),
});

export const certificadosRoutes = new Hono<{ Variables: AppVariables }>();

/**
 * Subir un certificado digital P12
 */
certificadosRoutes.post(
  "/upload",
  zValidator("json", CertificadoUploadSchema),
  async (c) => {
    try {
      const input = c.req.valid("json");
      const empresaId = c.get("empresaId");
      const supabase = c.get("supabase");

      // Verificar que el archivo esté en el request (en un entorno real vendría como multipart/form-data)
      // Para simplicidad, asumimos que viene como base64 en el cuerpo
      const { p12_base64, p12_password } = await c.req.json<{ 
        p12_base64: string; 
        p12_password: string 
      }>();

      if (!p12_base64 || !p12_password) {
        return c.json({ 
          code: "missing_credentials", 
          message: "p12_base64 y p12_password son requeridos" 
        }, 400);
      }

      // Validar fechas
      const inicio = new Date(input.vigencia_inicio);
      const fin = new Date(input.vigencia_fin);
      const hoy = new Date();

      if (inicio > fin) {
        return c.json({ 
          code: "fechas_invalidas", 
          message: "La fecha de inicio debe ser anterior a la fecha de fin" 
        }, 400);
      }

      if (fin < hoy) {
        return c.json({ 
          code: "certificado_expirado", 
          message: "El certificado no puede tener una fecha de fin en el pasado" 
        }, 400);
      }

      // Subir el archivo P12 a Supabase Storage
      const fileName = `${empresaId}/${input.nombre}_${Date.now()}.p12`;
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('sii-certificados')
        .upload(fileName, p12_base64, {
          contentType: 'application/x-pkcs12',
          upsert: false
        });

      if (uploadError) {
        return c.json({ 
          code: "upload_failed", 
          message: `Error al subir certificado: ${uploadError.message}` 
        }, 500);
      }

      // Obtener la URL pública del archivo (en este caso, como es privado, obtenemos la ruta)
      const { data: urlData } = supabase
        .storage
        .from('sii-certificados')
        .getPublicUrl(fileName);

      // Insertar registro en la tabla sii_certificados
      const { data: certData, error: certError } = await supabase
        .from("sii_certificados")
        .insert({
          empresa_id: empresaId,
          nombre: input.nombre,
          storage_path: fileName, // Ruta en el bucket
          vigencia_inicio: input.vigencia_inicio,
          vigencia_fin: input.vigencia_fin,
          activo: true, // Por defecto se activa al subir
        })
        .select()
        .single();

      if (certError) {
        // Si falla la inserción, intentar eliminar el archivo subido
        await supabase
          .storage
          .from('sii-certificados')
          .remove([fileName]);
          
        return c.json({ 
          code: "certificado_creation_failed", 
          message: `Error al crear registro de certificado: ${certError.message}` 
        }, 500);
      }

      return c.json({
        success: true,
        message: "Certificado subido correctamente",
        data: {
          id: certData.id,
          nombre: certData.nombre,
          vigencia_inicio: certData.vigencia_inicio,
          vigencia_fin: certData.vigencia_fin,
          storage_path: certData.storage_path,
          activo: certData.activo,
          created_at: certData.created_at,
        }
      }, 201);

    } catch (error) {
      console.error("[SII Certificados Upload] Error:", error);
      return c.json({ 
        code: "upload_error", 
        message: error instanceof Error ? error.message : "Error inesperado al subir certificado" 
      }, 500);
    }
  }
);

/**
 * Listar certificados de una empresa
 */
certificadosRoutes.get(
  "/",
  async (c) => {
    try {
      const empresaId = c.get("empresaId");
      const supabase = c.get("supabase");

      const { data: certs, error } = await (supabase as any)
        .from("sii_certificados")
        .select("id, nombre, vigencia_inicio, vigencia_fin, activo, created_at, updated_at")
        .eq("empresa_id", empresaId)
        .order("created_at", { ascending: false });

      if (error) {
        return c.json({ code: "list_failed", message: error.message }, 500);
      }

      // Agregar información de vigencia
      const certsConEstado = certs.map((cert: any) => {
        const hoy = new Date();
        const inicio = new Date(cert.vigencia_inicio);
        const fin = new Date(cert.vigencia_fin);
        
        let estado: string;
        if (!cert.activo) {
          estado = "inactivo";
        } else if (hoy < inicio) {
          estado = "no_vigente";
        } else if (hoy > fin) {
          estado = "expirado";
        } else {
          estado = "vigente";
        }

        return {
          ...cert,
          estado,
          dias_para_vencer: cert.activo && hoy <= fin ? 
            Math.ceil((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)) : 
            null
        };
      });

      return c.json({ data: certsConEstado });

    } catch (error) {
      console.error("[SII Certificados List] Error:", error);
      return c.json({ 
        code: "list_error", 
        message: error instanceof Error ? error.message : "Error inesperado al listar certificados" 
      }, 500);
    }
  }
);

/**
 * Obtener un certificado específico
 */
certificadosRoutes.get(
  "/:id",
  async (c) => {
    try {
      const certId = c.req.param("id");
      const empresaId = c.get("empresaId");
      const supabase = c.get("supabase");

      const { data: cert, error } = await supabase
        .from("sii_certificados")
        .select("id, nombre, vigencia_inicio, vigencia_fin, activo, storage_path, created_at, updated_at")
        .eq("id", certId)
        .eq("empresa_id", empresaId)
        .single();

      if (error) {
        return c.json({ code: "not_found", message: "Certificado no encontrado" }, 404);
      }

      if (!cert) {
        return c.json({ code: "not_found", message: "Certificado no encontrado" }, 404);
      }

      return c.json({ data: cert });

    } catch (error) {
      console.error("[SII Certificados Get] Error:", error);
      return c.json({ 
        code: "get_error", 
        message: error instanceof Error ? error.message : "Error inesperado al obtener certificado" 
      }, 500);
    }
  }
);

/**
 * Actualizar un certificado
 */
certificadosRoutes.patch(
  "/:id",
  zValidator("json", CertificadoUpdateSchema),
  async (c) => {
    try {
      const certId = c.req.param("id");
      const empresaId = c.get("empresaId");
      const input = c.req.valid("json");
      const supabase = c.get("supabase");

      // Si se está intentando activar, verificar que no haya otro activo
      if (input.activo === true) {
        const { data: activoExistente, error: activoError } = await (supabase as any)
          .from("sii_certificados")
          .select("id")
          .eq("empresa_id", empresaId)
          .eq("activo", true)
          .neq("id", certId)
          .maybeSingle();

        if (activoError) throw activoError;
        if (activoExistente) {
          return c.json({ 
            code: "certificado_activo_existente", 
            message: "Ya existe un certificado activo. Desactívelo primero antes de activar otro." 
          }, 409);
        }
      }

      const { data: certData, error: updateError } = await (supabase as any)
        .from("sii_certificados")
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", certId)
        .eq("empresa_id", empresaId)
        .select()
        .single();

      if (updateError) {
        return c.json({ code: "update_failed", message: updateError.message }, 500);
      }

      if (!certData) {
        return c.json({ code: "not_found", message: "Certificado no encontrado" }, 404);
      }

      return c.json({
        success: true,
        message: "Certificado actualizado correctamente",
        data: certData
      });

    } catch (error) {
      console.error("[SII Certificados Update] Error:", error);
      return c.json({ 
        code: "update_error", 
        message: error instanceof Error ? error.message : "Error inesperado al actualizar certificado" 
      }, 500);
    }
  }
);

/**
 * Activar/Desactivar un certificado (endpoint específico para cambio de estado)
 */
certificadosRoutes.post(
  "/:id/:action",
  async (c) => {
    try {
      const certId = c.req.param("id");
      const action = c.req.param("action"); // "activar" o "desactivar"
      const empresaId = c.get("empresaId");
      const supabase = c.get("supabase");

      if (action !== "activar" && action !== "desactivar") {
        return c.json({ 
          code: "action_invalida", 
          message: "Acción debe ser 'activar' o 'desactivar'" 
        }, 400);
      }

      // Si es activar, verificar que no haya otro activo
      if (action === "activar") {
        const { data: activoExistente, error: activoError } = await (supabase as any)
          .from("sii_certificados")
          .select("id")
          .eq("empresa_id", empresaId)
          .eq("activo", true)
          .neq("id", certId)
          .maybeSingle();

        if (activoError) throw activoError;
        if (activoExistente) {
          return c.json({ 
            code: "certificado_activo_existente", 
            message: "Ya existe un certificado activo. Desactívelo primero antes de activar otro." 
          }, 409);
        }
      }

      const { data: certData, error } = await (supabase as any)
        .from("sii_certificados")
        .update({
          activo: action === "activar",
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", certId)
        .eq("empresa_id", empresaId)
        .select()
        .single();

      if (error) {
        return c.json({ code: "update_failed", message: error.message }, 500);
      }

      if (!certData) {
        return c.json({ code: "not_found", message: "Certificado no encontrado" }, 404);
      }

      return c.json({
        success: true,
        message: `Certificado ${action}do correctamente`,
        data: certData
      });

    } catch (error) {
      console.error("[SII Certificados Activate/Deactivate] Error:", error);
      return c.json({ 
        code: "state_change_error", 
        message: error instanceof Error ? error.message : "Error inesperado al cambiar estado de certificado" 
      }, 500);
    }
  }
);

/**
 * Eliminar un certificado
 */
certificadosRoutes.delete(
  "/:id",
  async (c) => {
    try {
      const certId = c.req.param("id");
      const empresaId = c.get("empresaId");
      const supabase = c.get("supabase");

      // Obtener info del certificado antes de eliminar para borrar el archivo
      const { data: certData, error: certError } = await supabase
        .from("sii_certificados")
        .select("storage_path")
        .eq("id", certId)
        .eq("empresa_id", empresaId)
        .single();

      if (certError) {
        return c.json({ code: "not_found", message: "Certificado no encontrado" }, 404);
      }

      if (!certData) {
        return c.json({ code: "not_found", message: "Certificado no encontrado" }, 404);
      }

      // Eliminar el registro de la tabla
      const { data: deleteData, error: deleteError } = await supabase
        .from("sii_certificados")
        .delete()
        .eq("id", certId)
        .eq("empresa_id", empresaId);

      if (deleteError) {
        return c.json({ code: "delete_failed", message: deleteError.message }, 500);
      }

      // Eliminar el archivo de storage
      if (certData.storage_path) {
        await supabase
          .storage
          .from('sii-certificados')
          .remove([certData.storage_path]);
      }

      return c.json({
        success: true,
        message: "Certificado eliminado correctamente"
      });

    } catch (error) {
      console.error("[SII Certificados Delete] Error:", error);
      return c.json({ 
        code: "delete_error", 
        message: error instanceof Error ? error.message : "Error inesperado al eliminar certificado" 
      }, 500);
    }
  }
);

export default certificadosRoutes;
