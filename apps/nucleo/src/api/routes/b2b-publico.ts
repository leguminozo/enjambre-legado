import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createAdminClient } from "@enjambre/auth/server-index";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@enjambre/database/database.types";
import {
  CONTRATO_CONSIGNACION_VERSION,
  registroPuntoVentaSchema,
  registroRevendedorSchema,
  registroClienteSchema,
} from "@/lib/microcanales-types";
import { fromLoose } from "@/api/lib/supabase-loose";
import { clasificarTierInversion } from "@enjambre/pricing";
import { generarCodigo, normalizarWhatsapp } from "./b2b";

/**
 * Microcanales — flujo PÚBLICO (registro autónomo ligero sin contraseña).
 * El código/QR es un gatillante más, no el único: el café y el revendedor se
 * registran solos desde la landing y reciben su código; el consumidor se
 * registra por email, whatsapp o tarjeta.
 * Los writes van con admin client + validación estricta (patrón censo-publico).
 */
export const b2bPublicoRoutes = new Hono();

type Admin = SupabaseClient<Database>;

function admin(): Admin {
  return createAdminClient() as Admin;
}

/** GET /api/b2b-publico/condiciones-comerciales — reglas y tramos mayoristas oficiales */
b2bPublicoRoutes.get("/condiciones-comerciales", async (c) => {
  const supabase = admin();
  const [rulesRes, tiersRes] = await Promise.all([
    supabase.from("b2b_wholesale_rules").select("*").eq("id", 1).maybeSingle(),
    supabase.from("b2b_investment_tiers").select("*").order("prioridad", { ascending: true }),
  ]);

  return c.json({
    data: {
      rules: rulesRes.data ?? null,
      tiers: tiersRes.data ?? [],
    },
  });
});

/** GET /api/b2b-publico/portal/:codigo — info pública del punto (landing) */
b2bPublicoRoutes.get("/portal/:codigo", async (c) => {
  const codigo = c.req.param("codigo").trim().toUpperCase();
  const supabase = admin();

  const { data: punto } = await supabase
    .from("v_b2b_puntos_publicos")
    .select("id, nombre, tipo, ciudad, codigo_acceso")
    .eq("codigo_acceso", codigo)
    .maybeSingle();
  if (!punto || !punto.id) return c.json({ code: "not_found", message: "Local no encontrado" }, 404);

  const [sets, programa] = await Promise.all([
    supabase
      .from("b2b_sets_entrada")
      .select("*, b2b_set_items(*, productos(id, nombre, precio, fotos))")
      .eq("activo", true)
      .eq("tipo_entorno", punto.tipo ?? "otro")
      .order("sort_order"),
    supabase
      .from("fid_programas")
      .select("*")
      .eq("punto_venta_id", punto.id)
      .eq("activo", true)
      .order("created_at")
      .limit(1)
      .maybeSingle(),
  ]);

  return c.json({
    data: {
      punto,
      sets: (sets.data ?? []).map((s) => ({ ...s, items: s.b2b_set_items ?? [] })),
      programa: programa.data ?? null,
    },
  });
});

/** GET /api/b2b-publico/portal/chips — catálogo CATA activo (el instrumento lo consume la landing) */
b2bPublicoRoutes.get("/portal/chips", async (c) => {
  const supabase = admin();
  const { data, error } = await supabase
    .from("perc_chip_catalogos")
    .select("*")
    .eq("activo", true)
    .order("bloque, sort_order");
  if (error) return c.json({ code: "query_failed", message: error.message }, 500);
  return c.json({ data: data ?? [] });
});

/** POST /api/b2b-publico/registro-punto-venta — el local se registra solo.
 * Clasifica el tier por volumen estimado y registra la aceptación del
 * contrato de consignación (versión + timestamp). La patente se sube aparte. */
b2bPublicoRoutes.post(
  "/registro-punto-venta",
  zValidator("json", registroPuntoVentaSchema),
  async (c) => {
    const input = c.req.valid("json");
    const supabase = admin();
    const tier = clasificarTierInversion(input.volumen_mensual_clp ?? 0);
    // fromLoose: columnas de solicitud en runtime (migración 20260922160000);
    // el typegen se sincroniza con `pnpm db:typegen`. Si el esquema aún no
    // las tiene (deploy antes que DB), se registra la solicitud base.
    const completo = {
        nombre: input.nombre,
        tipo: input.tipo,
        ciudad: input.ciudad ?? null,
        contacto_nombre: input.contacto_nombre ?? null,
        contacto_email: input.contacto_email || null,
        volumen_mensual_clp: input.volumen_mensual_clp ?? null,
        rut_empresa: input.rut_empresa ?? null,
        tier_sugerido: tier.etiqueta,
        contrato_version: CONTRATO_CONSIGNACION_VERSION,
        contrato_aceptado_at: new Date().toISOString(),
        estado: "prospecto",
        codigo_acceso: generarCodigo(),
        origen: "autonomo",
    };
    const base = {
      nombre: input.nombre,
      tipo: input.tipo,
      ciudad: input.ciudad ?? null,
      contacto_nombre: input.contacto_nombre ?? null,
      contacto_email: input.contacto_email || null,
      estado: "prospecto",
      codigo_acceso: completo.codigo_acceso,
      origen: "autonomo",
    };
    let data: Record<string, unknown> | null = null;
    {
      const res = await fromLoose(supabase, "b2b_puntos_venta")
        .insert(completo)
        .select("id, nombre, codigo_acceso, estado, tier_sugerido")
        .single();
      if (res.error && /volumen_mensual_clp|rut_empresa|tier_sugerido|contrato_/i.test(res.error.message)) {
        const retry = await fromLoose(supabase, "b2b_puntos_venta")
          .insert(base)
          .select("id, nombre, codigo_acceso, estado")
          .single();
        if (retry.error) return c.json({ code: "create_failed", message: retry.error.message }, 400);
        data = { ...(retry.data as Record<string, unknown>), tier_sugerido: tier.etiqueta };
      } else if (res.error || !res.data) {
        return c.json({ code: "create_failed", message: (res.error as { message?: string } | null)?.message ?? "Error" }, 400);
      } else {
        data = res.data as Record<string, unknown>;
      }
    }

    // Sincronización en CRM centralizado (clientes + interacciones)
    try {
      const email = input.contacto_email?.trim().toLowerCase() || null;
      let crmClienteId: string | null = null;
      if (email) {
        const { data: existing } = await fromLoose(supabase, "clientes")
          .select("id")
          .eq("email", email)
          .maybeSingle();
        if (existing) crmClienteId = existing.id;
      }

      const clientType = input.tipo === 'tienda_gourmet' ? 'Gourmet' : input.tipo === 'hotel' ? 'B2B' : 'B2B';

      if (!crmClienteId) {
        const { data: newClient } = await fromLoose(supabase, "clientes")
          .insert({
            name: input.nombre,
            empresa: input.nombre,
            email,
            telefono: input.contacto_email || null,
            type: clientType,
            status: "prospecto",
            fuente: "web",
            notes: `Registro B2B punto de venta: ${input.tipo} · Tier: ${tier.etiqueta} · Contacto: ${input.contacto_nombre || 'No indicado'}`,
          })
          .select("id")
          .maybeSingle();
        if (newClient) crmClienteId = newClient.id;
      }

      if (crmClienteId) {
        const { data: empresa } = await fromLoose(supabase, "empresas")
          .select("id")
          .order("created_at")
          .limit(1)
          .maybeSingle();
        const { data: adminProf } = await supabase
          .from("profiles")
          .select("id")
          .eq("role", "admin")
          .order("created_at")
          .limit(1)
          .maybeSingle();

        if (empresa && adminProf) {
          await fromLoose(supabase, "interacciones").insert({
            cliente_id: crmClienteId,
            rep_id: adminProf.id,
            empresa_id: empresa.id,
            tipo: "otro",
            notas: `Postulación B2B (${input.tipo}) en ${input.ciudad || 'Chile'}. Código acceso: ${completo.codigo_acceso} · Tier: ${tier.etiqueta}`,
            resultado: "pendiente",
          });
        }
      }
    } catch (crmErr) {
      console.error("[b2b-publico] Error sincronizando prospecto con CRM:", crmErr);
    }

    return c.json({ data }, 201);
  },
);

// POST /api/b2b-publico/solicitud-patente — patente/RUT (PDF o imagen ≤ 5 MB).
// El BFF la guarda con service role vinculada a la solicitud (sin auth previa).
b2bPublicoRoutes.post("/solicitud-patente", async (c) => {
  try {
    const body = await c.req.parseBody();
    const puntoId = typeof body.punto_venta_id === "string" ? body.punto_venta_id : "";
    const archivo = body.archivo;
    if (!/^[0-9a-f-]{36}$/i.test(puntoId)) {
      return c.json({ code: "invalid_id", message: "Solicitud inválida" }, 400);
    }
    if (!(archivo instanceof File)) {
      return c.json({ code: "file_required", message: "Adjunta la patente (PDF o imagen)" }, 400);
    }
    const okTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!okTypes.includes(archivo.type) || archivo.size > 5 * 1024 * 1024) {
      return c.json({ code: "file_invalid", message: "PDF o imagen de máximo 5 MB" }, 400);
    }

    const supabase = admin();
    const { data: punto } = await supabase
      .from("b2b_puntos_venta")
      .select("id")
      .eq("id", puntoId)
      .eq("estado", "prospecto")
      .maybeSingle();
    if (!punto) return c.json({ code: "not_found", message: "Solicitud no encontrada" }, 404);

    const ext = archivo.type === "application/pdf" ? "pdf" : archivo.type.split("/")[1];
    const path = `${puntoId}/patente.${ext}`;
    const { error: upError } = await supabase.storage
      .from("b2b-patentes")
      .upload(path, archivo, { contentType: archivo.type, upsert: true });
    if (upError) return c.json({ code: "upload_failed", message: upError.message }, 500);

    await fromLoose(supabase, "b2b_puntos_venta").update({ patente_path: path }).eq("id", puntoId);
    return c.json({ data: { ok: true } }, 201);
  } catch {
    return c.json({ code: "internal_error", message: "No se pudo recibir la patente" }, 500);
  }
});

/** POST /api/b2b-publico/registro-revendedor — la persona se registra sola */
b2bPublicoRoutes.post(
  "/registro-revendedor",
  zValidator("json", registroRevendedorSchema),
  async (c) => {
    const input = c.req.valid("json");
    const supabase = admin();
    const { data, error } = await supabase
      .from("b2b_revendedores")
      .insert({
        nombre: input.nombre,
        whatsapp: input.whatsapp ?? null,
        tipo_espacio: input.tipo_espacio,
        estado: "prospecto",
        codigo_revendedor: generarCodigo(),
        origen: "autonomo",
      })
      .select("id, nombre, codigo_revendedor, estado")
      .single();
    if (error) return c.json({ code: "create_failed", message: error.message }, 400);

    // Sincronización en CRM centralizado
    try {
      const { data: newClient } = await fromLoose(supabase, "clientes")
        .insert({
          name: input.nombre,
          telefono: input.whatsapp || null,
          type: "B2B",
          status: "prospecto",
          fuente: "web",
          notes: `Postulación revendedor territorial · Espacio: ${input.tipo_espacio}`,
        })
        .select("id")
        .maybeSingle();

      if (newClient) {
        const { data: empresa } = await fromLoose(supabase, "empresas")
          .select("id")
          .order("created_at")
          .limit(1)
          .maybeSingle();
        const { data: adminProf } = await supabase
          .from("profiles")
          .select("id")
          .eq("role", "admin")
          .order("created_at")
          .limit(1)
          .maybeSingle();

        if (empresa && adminProf) {
          await fromLoose(supabase, "interacciones").insert({
            cliente_id: newClient.id,
            rep_id: adminProf.id,
            empresa_id: empresa.id,
            tipo: "otro",
            notas: `Postulación revendedor (${input.tipo_espacio}). Código revendedor: ${data.codigo_revendedor}`,
            resultado: "pendiente",
          });
        }
      }
    } catch (crmErr) {
      console.error("[b2b-publico] Error sincronizando revendedor con CRM:", crmErr);
    }

    return c.json({ data }, 201);
  },
);

/** POST /api/b2b-publico/clientes — registro autónomo del consumidor (identidad global) */
b2bPublicoRoutes.post(
  "/clientes",
  zValidator("json", registroClienteSchema),
  async (c) => {
    const input = c.req.valid("json");
    const supabase = admin();

    const { data: punto } = await supabase
      .from("v_b2b_puntos_publicos")
      .select("id")
      .eq("codigo_acceso", input.codigo_punto.trim().toUpperCase())
      .maybeSingle();
    if (!punto || !punto.id) return c.json({ code: "punto_invalido", message: "Local no encontrado" }, 404);

    // Identidad global: buscar por email o whatsapp; la tarjeta (codigo_cliente)
    // se usa UNA vez para vincular (después la identidad es whatsapp/email).
    const email = input.email?.trim().toLowerCase() || null;
    const whatsapp = normalizarWhatsapp(input.whatsapp);
    const query = supabase.from("fid_clientes").select("*");
    const { data: porEmail } = email
      ? await query.eq("email", email).maybeSingle()
      : { data: null };
    const { data: porWhatsapp } = !porEmail && whatsapp
      ? await supabase.from("fid_clientes").select("*").eq("whatsapp", whatsapp).maybeSingle()
      : { data: null };

    let cliente = porEmail ?? porWhatsapp;
    let nuevo = false;
    if (!cliente) {
      const creado = await supabase
        .from("fid_clientes")
        .insert({
          email,
          whatsapp,
          nombre: input.nombre ?? null,
          codigo_cliente: generarCodigo(8),
          consentimiento: true,
          consentimiento_at: new Date().toISOString(),
        })
        .select("*")
        .single();
      cliente = creado.data;
      nuevo = true;
    }
    if (!cliente) return c.json({ code: "cliente_error", message: "No se pudo registrar" }, 400);

    // Asegurar membresía en este punto (endowed progress: arranca con 1 sello).
    const { data: mem } = await supabase
      .from("fid_membresias")
      .select("*")
      .eq("cliente_id", cliente.id)
      .eq("punto_venta_id", punto.id)
      .maybeSingle();
    if (!mem) {
      // Welcome: primeros puntos del revendedor desde fid_valores
      // (clave 'revendedor_puntos_bienvenida', seed 200) — la intención del
      // seed estaba documentada pero nadie la consumía (huérfano #5).
      const { data: valorWelcome } = await supabase
        .from("fid_valores")
        .select("valor")
        .eq("clave", "revendedor_puntos_bienvenida")
        .eq("activo", true)
        .maybeSingle();
      const ptsBienvenida = valorWelcome?.valor != null ? Number(valorWelcome.valor) : 0;

      const { data: memCreada } = await supabase
        .from("fid_membresias")
        .insert({
          cliente_id: cliente.id,
          punto_venta_id: punto.id,
          saldo_sellos: 1,
          sellos_iniciales: 1,
          ...(ptsBienvenida > 0 ? { saldo_puntos: ptsBienvenida } : {}),
        })
        .select("*")
        .single();

      // Ledger inmutable: registrar el endowment como 'ajuste' (el CHECK de
      // fid_eventos.tipo no tiene 'bienvenida').
      if (ptsBienvenida > 0 && memCreada) {
        await supabase.from("fid_eventos").insert({
          cliente_id: cliente.id,
          punto_venta_id: punto.id,
          membresia_id: memCreada.id,
          tipo: "ajuste",
          cantidad: ptsBienvenida,
          origen: "portal",
          notas: "Bienvenida: primeros puntos del revendedor",
        });
      }
    }

    return c.json({
      data: {
        cliente: { id: cliente.id, codigo_cliente: cliente.codigo_cliente, nombre: cliente.nombre, email: cliente.email, whatsapp: cliente.whatsapp },
        nuevo,
      },
    }, 201);
  },
);

/** GET /api/b2b-publico/clientes/:codigo — saldo de la tarjeta (verificación en el local) */
b2bPublicoRoutes.get("/clientes/:codigo", async (c) => {
  const codigo = c.req.param("codigo").trim().toUpperCase();
  const supabase = admin();
  const { data: cliente } = await supabase
    .from("fid_clientes")
    .select("id, nombre, codigo_cliente")
    .eq("codigo_cliente", codigo)
    .maybeSingle();
  if (!cliente) return c.json({ code: "not_found", message: "Tarjeta no encontrada" }, 404);

  const { data: membresias } = await supabase
    .from("fid_membresias")
    .select("saldo_sellos, saldo_puntos, b2b_puntos_venta(nombre)")
    .eq("cliente_id", cliente.id);

  return c.json({
    data: {
      cliente,
      membresias: (membresias ?? []).map((m) => ({
        punto: m.b2b_puntos_venta?.nombre ?? "—",
        saldo_sellos: m.saldo_sellos,
        saldo_puntos: m.saldo_puntos,
      })),
    },
  });
});
