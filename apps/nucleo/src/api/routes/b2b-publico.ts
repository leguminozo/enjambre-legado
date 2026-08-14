import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createAdminClient } from "@enjambre/auth/browser";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@enjambre/database/database.types";
import {
  registroPuntoVentaSchema,
  registroRevendedorSchema,
  registroClienteSchema,
} from "@/lib/microcanales-types";
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

/** POST /api/b2b-publico/registro-punto-venta — el café se registra solo */
b2bPublicoRoutes.post(
  "/registro-punto-venta",
  zValidator("json", registroPuntoVentaSchema),
  async (c) => {
    const input = c.req.valid("json");
    const supabase = admin();
    const { data, error } = await supabase
      .from("b2b_puntos_venta")
      .insert({
        nombre: input.nombre,
        tipo: input.tipo,
        ciudad: input.ciudad ?? null,
        contacto_nombre: input.contacto_nombre ?? null,
        contacto_email: input.contacto_email || null,
        estado: "prospecto",
        codigo_acceso: generarCodigo(),
        origen: "autonomo",
      })
      .select("id, nombre, codigo_acceso, estado")
      .single();
    if (error) return c.json({ code: "create_failed", message: error.message }, 400);
    return c.json({ data }, 201);
  },
);

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
    let query = supabase.from("fid_clientes").select("*");
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
