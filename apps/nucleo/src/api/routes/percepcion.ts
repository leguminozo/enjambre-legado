import { Hono } from "hono";
import { createHash } from "node:crypto";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "@/api/lib/middleware";
import type { AppVariables } from "@/api/lib/middleware";
import { createAdminClient } from "@enjambre/auth/server-index";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@enjambre/database/database.types";
import { sesionPercepcionSchema } from "@/lib/microcanales-types";
import { generarCodigo, normalizarWhatsapp } from "./b2b";

/**
 * Percepción semántica profunda — el instrumento (público) y los agregados (auth).
 *
 * Instrumento de ~60s (estado del arte IHC/DLG + panel chileno):
 *   1) 3 pares bipolares (Suave-Intenso · Dulce-Ácido · Líquida-Cremosa)
 *   2) chips CATA progresivos (sabor/aroma obligatorios; textura/color opcionales)
 *   3) abierta "¿A qué te recuerda?" + agrado 1–5 + intención de recompra
 * La sesión es ANÓNIMA válida (no depende de identidad); la identidad solo suma
 * puntos. Con producto_id se genera una reseña 'pendiente' (moderación existente)
 * que publica los datos profundos en tienda — una sola fuente de verdad (FK).
 */
export const percepcionRoutes = new Hono<{ Variables: AppVariables }>();

type Admin = SupabaseClient<Database>;
function admin(): Admin {
  return createAdminClient() as Admin;
}

const toNum = (v: unknown): number => Number(v ?? 0);

async function leerValor(supabase: Admin, clave: string, fallback: number): Promise<number> {
  const { data } = await supabase
    .from("fid_valores")
    .select("valor")
    .eq("clave", clave)
    .eq("activo", true)
    .maybeSingle();
  return data?.valor != null ? Number(data.valor) : fallback;
}

/** POST /api/percepcion/sesiones — instrumento completo (público, admin client) */
percepcionRoutes.post(
  "/sesiones",
  zValidator("json", sesionPercepcionSchema, (result, c) => {
    if (!result.success) {
      const issue = result.error.issues[0];
      const field = issue?.path?.join(".") || "campo";
      const msg = issue?.message || "Dato no válido";
      return c.json(
        {
          code: "invalid_payload",
          message: `Dato no válido en ${field}: ${msg}`,
          details: result.error.issues,
        },
        400,
      );
    }
  }),
  async (c) => {
    const input = c.req.valid("json");
    const supabase = admin();

    const normCodigoPunto = (input.codigo_punto || "").trim().toUpperCase();

    let { data: punto } = await supabase
      .from("v_b2b_puntos_publicos")
      .select("id, nombre, tipo, ciudad")
      .eq("codigo_acceso", normCodigoPunto)
      .maybeSingle();

    // Si no está en v_b2b_puntos_publicos, resolver puntos canónicos de degustación / feria
    if (!punto || !punto.id) {
      const CANONICAL_POINTS: Record<string, { nombre: string; tipo: 'feria_evento'; ciudad: string }> = {
        FERIA: { nombre: 'Estación de Degustación en Vivo · Stand Feria', tipo: 'feria_evento', ciudad: 'Chile' },
        STAND: { nombre: 'Estación de Degustación en Vivo · Stand Feria', tipo: 'feria_evento', ciudad: 'Chile' },
        DEGUSTACION: { nombre: 'Estación de Degustación en Vivo · Stand Feria', tipo: 'feria_evento', ciudad: 'Chile' },
        CREACIONES: { nombre: 'Estación de Degustación en Vivo · Creaciones de Mesa', tipo: 'feria_evento', ciudad: 'Chile' },
        CHILE: { nombre: 'Atlas Botánico de Chile · Mieles Monoflorales', tipo: 'feria_evento', ciudad: 'Chile' },
        MIELES_CHILE: { nombre: 'Atlas Botánico de Chile · Mieles Monoflorales', tipo: 'feria_evento', ciudad: 'Chile' },
        WEB: { nombre: 'Portal Web · Degustación Sensorial', tipo: 'feria_evento', ciudad: 'Chile' },
      };

      const canon = CANONICAL_POINTS[normCodigoPunto];
      if (canon) {
        const { data: upserted } = await supabase
          .from("b2b_puntos_venta")
          .upsert(
            {
              codigo_acceso: normCodigoPunto,
              nombre: canon.nombre,
              tipo: canon.tipo,
              ciudad: canon.ciudad,
              estado: "activo",
              publico: true,
              origen: "marca",
            },
            { onConflict: "codigo_acceso" }
          )
          .select("id, nombre, tipo, ciudad")
          .maybeSingle();

        if (upserted && upserted.id) {
          punto = upserted;
        }
      }
    }

    if (!punto || !punto.id) return c.json({ code: "punto_invalido", message: "Local no encontrado" }, 404);

    // Resolver producto_id si viene como slug o UUID
    let resolvedProductoId: string | null = null;
    if (input.producto_id && input.producto_id.trim()) {
      const pId = input.producto_id.trim();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(pId);
      if (isUuid) {
        resolvedProductoId = pId;
      } else {
        const { data: prod } = await supabase
          .from("productos")
          .select("id")
          .eq("slug", pId)
          .maybeSingle();
        resolvedProductoId = prod?.id ?? null;
      }
    }

    // Resolver variante_id si viene como SKU o UUID
    let resolvedVarianteId: string | null = null;
    if (input.variante_id && input.variante_id.trim()) {
      const vId = input.variante_id.trim();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(vId);
      if (isUuid) {
        resolvedVarianteId = vId;
      } else {
        const { data: vRow } = await supabase
          .from("producto_variantes")
          .select("id")
          .or(`sku.eq.${vId},nombre_variante.eq.${vId}`)
          .maybeSingle();
        resolvedVarianteId = vRow?.id ?? null;
      }
    }

    // Identidad opcional: email, whatsapp o tarjeta (codigo_cliente)
    let clienteId: string | null = null;
    const email = input.email?.trim().toLowerCase() || null;
    const whatsapp = normalizarWhatsapp(input.whatsapp);
    const codigoTarjeta = input.codigo_cliente?.trim().toUpperCase() || null;
    if (email || whatsapp || codigoTarjeta) {
      let cliente = null;
      if (codigoTarjeta) {
        const { data: porTarjeta } = await supabase
          .from("fid_clientes")
          .select("*")
          .eq("codigo_cliente", codigoTarjeta)
          .maybeSingle();
        cliente = porTarjeta;
      }
      if (!cliente && email) {
        const { data: porEmail } = await supabase
          .from("fid_clientes")
          .select("*")
          .eq("email", email)
          .maybeSingle();
        cliente = porEmail;
      }
      if (!cliente && whatsapp) {
        const { data: porWhatsapp } = await supabase
          .from("fid_clientes")
          .select("*")
          .eq("whatsapp", whatsapp)
          .maybeSingle();
        cliente = porWhatsapp;
      }
      if (!cliente) {
        const { data: creado } = await supabase
          .from("fid_clientes")
          .insert({
            email,
            whatsapp,
            codigo_cliente: codigoTarjeta ?? generarCodigo(8),
            consentimiento: true,
            consentimiento_at: new Date().toISOString(),
          })
          .select("id")
          .single();
        cliente = creado;
      }
      clienteId = cliente?.id ?? null;

      // Asegurar membresía en este punto
      if (clienteId) {
        const { data: mem } = await supabase
          .from("fid_membresias")
          .select("id")
          .eq("cliente_id", clienteId)
          .eq("punto_venta_id", punto.id)
          .maybeSingle();
        if (!mem) {
          await supabase.from("fid_membresias").insert({
            cliente_id: clienteId,
            punto_venta_id: punto.id,
            saldo_sellos: 1,
            sellos_iniciales: 1,
          });
        }
      }
    }

    const agradoNum = Math.max(1, Math.min(10, Math.round(Number(input.agrado) || 10)));
    const agrado1a5 = Math.max(1, Math.min(5, Math.round(agradoNum / 2)));

    // Sesión con contrabalanceo (seed del orden de chips)
    const sesionPayload = {
      punto_venta_id: punto.id,
      producto_id: resolvedProductoId,
      variante_id: resolvedVarianteId,
      tipo_sensorial: input.tipo_sensorial ?? 'miel',
      cliente_id: clienteId,
      codigo_punto: normCodigoPunto,
      origen: "qr" as const,
      completo: true,
      seed_orden: Math.floor(Math.random() * 100000),
      agrado_1_5: agradoNum,
      intencion_recompra: input.intencion_recompra ?? true,
      tipo_evaluador: input.tipo_evaluador ?? 'consumidor',
      consentimiento: input.consentimiento ?? true,
    };

    let { data: sesion, error: sesionError } = await supabase
      .from("perc_sesiones")
      .insert(sesionPayload)
      .select("id")
      .single();

    if (!sesion && sesionError && agradoNum > 5) {
      // Fallback si la base de datos de producción aún tiene el check histórico de 1 a 5
      const retry = await supabase
        .from("perc_sesiones")
        .insert({ ...sesionPayload, agrado_1_5: agrado1a5 })
        .select("id")
        .single();
      sesion = retry.data;
    }

    if (!sesion) return c.json({ code: "create_failed", message: "No se pudo guardar la sesión" }, 500);

    if (input.pares && input.pares.length > 0) {
      await supabase.from("perc_pares").insert(
        input.pares.map((p) => ({
          sesion_id: sesion.id,
          par: p.par,
          valor: Math.max(-3, Math.min(3, Math.round(Number(p.valor) || 0))),
        })),
      );
    }

    if (input.chips && input.chips.length > 0) {
      await supabase.from("perc_chips").insert(
        input.chips.map((ch) => ({
          sesion_id: sesion.id,
          bloque: ch.bloque,
          chip: ch.chip,
        })),
      );
    }

    if (input.abierta) {
      await supabase.from("perc_abiertas").insert({ sesion_id: sesion.id, texto: input.abierta });
    }

    // Puntos por pulso semántico (identidad global)
    let puntos = 0;
    if (clienteId) {
      puntos = await leerValor(supabase, "feedback_semantico_puntos", 25);
      const { data: mem } = await supabase
        .from("fid_membresias")
        .select("id, saldo_puntos")
        .eq("cliente_id", clienteId)
        .eq("punto_venta_id", punto.id)
        .maybeSingle();
      if (mem) {
        await supabase.from("fid_eventos").insert({
          cliente_id: clienteId,
          punto_venta_id: punto.id,
          membresia_id: mem.id,
          tipo: "feedback_semantico",
          cantidad: puntos,
          origen: "qr",
          ref_id: sesion.id,
          notas: "Pulso semántico completo",
        });
        await supabase
          .from("fid_membresias")
          .update({ saldo_puntos: Number(mem.saldo_puntos) + puntos })
          .eq("id", mem.id);
      }
    }

    // Publicación en tienda: reseña profunda pendiente (moderación existente).
    // Las reseñas anónimas exigen anon_hash + comentario ≤ 280 (CHECK de la tabla).
    if (resolvedProductoId) {
      let tipoTexto = 'Degustación en Punto Aliado';
      if (punto.tipo === 'cafeteria') tipoTexto = 'Degustación en Cafetería';
      else if (punto.tipo === 'hotel') tipoTexto = 'Huésped en Hotel Asociado';
      else if (punto.tipo === 'feria_evento') tipoTexto = 'Encuentro en Feria Territorial';
      else if (punto.tipo === 'restaurante') tipoTexto = 'Degustación en Restaurante';
      else if (punto.tipo === 'tienda_gourmet') tipoTexto = 'Degustación en Tienda Gourmet';

      const locationSuffix = punto.ciudad ? ` · ${punto.ciudad}` : '';
      const cleanDisplayName = `${tipoTexto}${locationSuffix}`;

      const resenaPayload = {
        producto_id: resolvedProductoId,
        variante_id: resolvedVarianteId,
        tipo_sensorial: input.tipo_sensorial ?? 'miel',
        modo: "anonima" as const,
        estado: "pendiente" as const,
        rating: agradoNum,
        comentario_corto: (input.abierta || `Degustación sensorial en ${punto.nombre || 'punto aliado'}`).slice(0, 280),
        display_name: cleanDisplayName,
        anon_hash: createHash("sha256").update(`percepcion:${sesion.id}`).digest("hex"),
        percepcion_sesion_id: sesion.id,
        notas_personales: input.abierta ?? null,
        atributos_sensoriales: {
          floracion_slug: input.floracion_slug ?? null,
          pares: input.pares ?? [],
          chips: input.chips ?? [],
          ejes_calibracion: input.ejes_calibracion ?? null,
          rating_1_10: agradoNum,
          codigo_punto: normCodigoPunto,
          punto_nombre: punto.nombre,
        },
      };

      const { error: resenaError } = await supabase.from("resenas_producto").insert(resenaPayload);
      if (resenaError && agradoNum > 7) {
        const fallbackRating = Math.max(1, Math.min(7, Math.round((agradoNum * 7) / 10)));
        await supabase.from("resenas_producto").insert({
          ...resenaPayload,
          rating: fallbackRating,
        });
      }
    }

    return c.json({
      data: {
        sesion_id: sesion.id,
        puntos_ganados: puntos,
        cliente_id: clienteId,
      },
    }, 201);
  }
);

/** GET /api/percepcion/sesiones?punto_id= — agregados (admin o dueño del punto) */
percepcionRoutes.get("/sesiones", authMiddleware, async (c) => {
  const supabase = c.get("supabase");
  const puntoId = c.req.query("punto_id");
  if (!puntoId) return c.json({ code: "invalid_params", message: "Falta punto_id" }, 400);

  const { data: sesiones, error } = await supabase
    .from("perc_sesiones")
    .select(
      "id, punto_venta_id, producto_id, cliente_id, origen, completo, agrado_1_5, intencion_recompra, tipo_evaluador, created_at",
    )
    .eq("punto_venta_id", puntoId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return c.json({ code: "query_failed", message: error.message }, 500);

  const ids = (sesiones ?? []).map((s) => s.id);
  const [pares, chips, abiertas] = await Promise.all([
    ids.length
      ? supabase.from("perc_pares").select("sesion_id, par, valor").in("sesion_id", ids)
      : Promise.resolve({ data: [] }),
    ids.length
      ? supabase.from("perc_chips").select("sesion_id, bloque, chip").in("sesion_id", ids)
      : Promise.resolve({ data: [] }),
    ids.length
      ? supabase.from("perc_abiertas").select("sesion_id, texto, created_at").in("sesion_id", ids)
      : Promise.resolve({ data: [] }),
  ]);

  const paresPorSesion = new Map<string, { par: string; valor: number }[]>();
  for (const p of pares.data ?? []) {
    const arr = paresPorSesion.get(p.sesion_id) ?? [];
    arr.push({ par: p.par, valor: p.valor });
    paresPorSesion.set(p.sesion_id, arr);
  }
  const chipsPorSesion = new Map<string, { bloque: string; chip: string }[]>();
  for (const ch of chips.data ?? []) {
    const arr = chipsPorSesion.get(ch.sesion_id) ?? [];
    arr.push({ bloque: ch.bloque, chip: ch.chip });
    chipsPorSesion.set(ch.sesion_id, arr);
  }
  const abiertaPorSesion = new Map<string, { texto: string }>();
  for (const a of abiertas.data ?? []) {
    if (!abiertaPorSesion.has(a.sesion_id)) abiertaPorSesion.set(a.sesion_id, { texto: a.texto });
  }

  const sesionesCompletas = (sesiones ?? []).map((s) => ({
    ...s,
    pares: paresPorSesion.get(s.id) ?? [],
    chips: chipsPorSesion.get(s.id) ?? [],
    abierta: abiertaPorSesion.get(s.id) ?? null,
  }));

  // Promedios por par y frecuencia de chips
  const paresAcum: Record<string, { suma: number; n: number }> = {};
  for (const p of pares.data ?? []) {
    paresAcum[p.par] = paresAcum[p.par] ?? { suma: 0, n: 0 };
    paresAcum[p.par].suma += p.valor;
    paresAcum[p.par].n += 1;
  }
  const chipsAcum: Record<string, { bloque: string; n: number }> = {};
  for (const ch of chips.data ?? []) {
    const key = `${ch.bloque}:${ch.chip}`;
    chipsAcum[key] = chipsAcum[key] ?? { bloque: ch.bloque, n: 0 };
    chipsAcum[key].n += 1;
  }

  const UMBRAL_PERFIL = 30;
  const n = sesionesCompletas.length;

  return c.json({
    data: {
      sesiones: sesionesCompletas,
      n,
      umbral_perfil: UMBRAL_PERFIL,
      perfil_listo: n >= UMBRAL_PERFIL,
      pares_promedio: Object.entries(paresAcum).map(([par, v]) => ({
        par,
        promedio: Math.round((v.suma / v.n) * 100) / 100,
        n: v.n,
      })),
      chips_frecuencia: Object.entries(chipsAcum)
        .map(([key, v]) => ({ bloque: v.bloque, chip: key.split(":")[1], n: v.n }))
        .sort((a, b) => b.n - a.n),
      abiertas_recientes: (abiertas.data ?? [])
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
        .slice(0, 20)
        .map((a) => ({ texto: a.texto, created_at: a.created_at })),
    },
  });
});
