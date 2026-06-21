# Red de Intercambio — Puntos legales frágiles y decisiones de implementación

> **Estado:** vigente desde implementación Red de Intercambio (jun 2026)  
> **Alcance:** creadores/embajadores, aliados B2B, operadores de feria, comisiones y honorarios.  
> **Disclaimer:** este documento guía decisiones de ingeniería. No sustituye asesoría legal tributaria ni laboral.

---

## 1. Naturaleza jurídica de cada participante

| Participante | Relación jurídica presumida | Decisión de código |
|--------------|----------------------------|------------------|
| **Embajador (creador)** | Mandato comercial / programa de afiliados (no relación laboral) | Tratado como **comisión por referido**, no sueldo. UI usa “comisión”, nunca “salario” ni “sueldo”. |
| **Aliado B2B (revendedor mayorista)** | Compra-reventa / distribución | Precio mayorista vía rol `revendedor`; sin comisión automática en checkout. |
| **Operador feria (`rep_ventas` + contrato)** | Prestación de servicios independiente (honorarios) | Pagos vía **boleta de honorarios** + retención art. 42 N°2. Sin órdenes de trabajo en sistema. |

**Decisión:** no crear roles auth adicionales. La relación jurídica se expresa en tablas de perfil (`creadores`, `revendedor_profile`, `participante_contrato`), no en `profiles.role`.

---

## 2. Comisiones de creadores (afiliados)

### Riesgos
- Reclasificación como relación laboral si hay subordinación, horario fijo o sueldo disfrazado.
- Publicidad engañosa si el descuento/comisión no se cumple.
- Autofraude (creador usa su propio código).

### Decisiones implementadas
| Control | Implementación |
|---------|----------------|
| Límite de comisión | DB: `porcentaje_comision <= 30`, `descuento_cliente <= 15` (migración 14) |
| Anti auto-uso | RPC `aplicar_codigo_creador` rechaza si `p_cliente_id = creador.user_id` |
| Retiro atómico | RPC `solicitar_retiro_creador` con advisory lock (migración 15) |
| Capabilities admin | Columna `creadores.capabilities` JSONB; admin puede desactivar retiros |
| Tope retiro mensual | Validado en RPC + UI; default 500.000 CLP |
| Texto UI | “Comisión por referido”, “Solicitud de liquidación” (no “pago de sueldo”) |

### Pendiente legal (fuera de código, obligatorio antes de escalar)
- [ ] Contrato escrito de programa de embajadores (T&C + anexo comisiones).
- [ ] Política de divulgación (#publicidad / enlace de afiliado según plataforma).
- [ ] Emisión de documento tributario al pagar comisiones (según monto y naturaleza: puede ser boleta honorarios del creador a la empresa).

---

## 3. Retiros y datos de pago (PII)

### Riesgos
- Almacenar cuentas bancarias sin consentimiento ni cifrado.
- Exponer `datos_pago` JSONB a otros usuarios vía RLS débil.

### Decisiones implementadas
| Control | Implementación |
|---------|----------------|
| Consentimiento explícito | Checkbox obligatorio antes de solicitar retiro: acepta tratamiento de datos de pago |
| Minimización | Solo se piden datos según método elegido |
| RLS | Creador solo ve sus retiros; admin revisa desde panel núcleo |
| Auditoría | `revisado_por`, `revisado_at` en `creador_retiros` |

### Texto UI obligatorio (portal creador)
> “Al solicitar un retiro, autorizas el uso de tus datos de pago exclusivamente para procesar esta liquidación de comisiones, conforme a nuestra política de privacidad.”

---

## 4. Aliados B2B (ex-Vanguardia)

### Riesgos
- Venta a menor sin inscripción en SII del aliado.
- Trato preferencial sin contrato que justifique descuento.

### Decisiones implementadas
| Control | Implementación |
|---------|----------------|
| Onboarding | Estado `pendiente` → admin aprueba en CRM tab “Aliados B2B” |
| Identificación | `rut` + `razon_social` obligatorios en `revendedor_profile` |
| Precio mayorista | Solo con rol `revendedor` activo en `user_roles` |
| Reseñas sensoriales | Inmutables (sin UPDATE); contenido generado por usuario |

### Pendiente legal
- [ ] Verificar que aliado B2B tenga inicio de actividades o factura como consumidor final según corresponda.
- [ ] Contrato de distribución / condiciones mayoristas por escrito.

---

## 5. Operadores de feria y honorarios

### Riesgos
- Relación laboral encubierta (horario, exclusividad, subordinación).
- Emisión incorrecta de boleta de honorarios o sin retención.
- Pérdida de stock sin responsabilidad contractual.

### Decisiones implementadas
| Control | Implementación |
|---------|----------------|
| Sin órdenes | El sistema no envía “órdenes”; solo contrato + incentivos + arqueo |
| Contrato explícito | `participante_contrato.acepto_terminos_at` + `acepto_terminos_version` obligatorios para `estado = activo` |
| Reps sin contrato feria | Panel admin lista `rep_ventas` sin contrato `activo` (`OperadoresFeriaPanel` + `RepsPanel`); enlace directo `?rep=` para crear borrador; guard evita duplicar borrador/activo |
| Consignación | `participante_consignacion` registra entregado/vendido/devuelto. **Entrega:** admin vía RPC `registrar_consignacion_feria` (descuenta `productos.stock`). **Devolución:** RPC `registrar_devolucion_consignacion_feria` — operador en evento `en_curso` o admin en evento abierto; máximo = pendiente (`entregada − vendida − devuelta`); repone almacén por defecto |
| Campo POS (feria) | Con evento `en_curso`, ventas `channel=feria` **deben** descontar consignación (`validar_consignacion_feria` → 409 si insuficiente). Sin evento activo, venta feria usa stock de almacén. Comisión rep vía `commission_records` (no duplicar en `incentivo_ledger`). |
| Arqueo obligatorio | `participante_arqueo` al cierre; diferencia bloquea próximo evento si `score_confianza < umbral` |
| Honorarios | `incentivo_ledger` aprobado → RPC `preparar_honorario_desde_ledger` crea fila en `honorarios` (retención F29). Emisión DTE honorarios sigue requiriendo revisión admin; no automática |
| Retención | Usar `retencionHonorarios` en F29 (`packages/contable`) al registrar pago |

### Principio de incentivos (no subordinación)
Los bonos (`bono_puntualidad`, `bono_volumen_tiers`) son **metas autónomas**, no penalidades por incumplir horario laboral. La UI dice “meta de evento”, no “jornada”.

### Pendiente legal
- [ ] Contrato de prestación de servicios independiente por operador.
- [ ] Confirmar con contador: emisión boleta honorarios electrónica y retención 10,75% / 13,75% según caso.
- [ ] Seguro o garantía de stock consignado (cláusula contractual).

---

## 6. Nomenclatura prohibida en UI y código

Para reducir riesgo de reclasificación laboral:

| ❌ Evitar | ✅ Usar |
|----------|---------|
| empleado, sueldo, salario | participante, operador, comisión, honorario |
| orden de trabajo | contrato de evento, meta de venta |
| nómina | liquidación de comisiones / honorarios |
| despido | suspensión de participación |

---

## 7. Matriz de responsabilidades admin

| Acción | Requiere revisión humana | Automatizable |
|--------|-------------------------|---------------|
| Activar creador | Sí (admin) | No |
| Aprobar retiro creador | Sí | No |
| Activar aliado B2B | Sí | No |
| Activar contrato feria | Sí + términos aceptados | Parcial |
| Calcular comisión por venta | Sí (reglas pre-aprobadas) | Sí |
| Emitir boleta honorarios | Sí (contador/admin) | Preparar borrador |
| Bloquear por arqueo negativo | Sí (umbral automático + apelación manual) | Alerta automática |

---

## 8. Referencias en código

| Módulo | Ruta |
|--------|------|
| Portal creador (tienda) | `apps/tienda/app/perfil/creador/` |
| Admin creadores | `apps/nucleo/app/(dashboard)/creadores/` |
| Aliados B2B (CRM) | `apps/nucleo/src/views/crm/components/AliadosB2BTab.tsx` |
| Admin operadores feria | `apps/nucleo/app/(dashboard)/operadores-feria/` |
| Portal rep feria | `apps/nucleo/app/(dashboard)/mi-feria/` |
| Contrato feria | `packages/database/supabase/migrations/65_red_intercambio.sql` |
| Ledger unificado | `packages/database/supabase/migrations/66_incentivo_ledger.sql` |
| Cierre arqueo RPC | `cerrar_arqueo_feria` (migración 66) |
| Campo POS ↔ consignación | `apps/campo/src/app/api/pos/venta/route.ts`, `apps/nucleo/src/api/routes/rep-ventas.ts`, RPCs migración 67 |
| Consignación admin + stock | RPC `registrar_consignacion_feria` (migración 68) · `OperadoresFeriaPanel` |
| Devolución consignación | RPC `registrar_devolucion_consignacion_feria` (migración 70) · `OperadoresFeriaPanel` + `MiFeriaPortal` |
| Gap reps ↔ contrato feria | `feria-contrato-status.ts` · `/reps` + `/operadores-feria?rep=` |
| Puente ledger → SII | RPC `preparar_honorario_desde_ledger` (migración 71) · `POST /api/sii/honorarios/desde-ledger` · tab Ledger en `OperadoresFeriaPanel` |
| Offline Campo + feria | `apps/campo/src/lib/offline/feria-offline.ts`, cache Dexie `feria_context`, `use-sync-engine.ts` |
| Retiro atómico | `solicitar_retiro_creador` en migración 15 + ampliación 65 |

### Activación de contrato feria (decisión admin)

Al marcar contrato `activo`, el admin confirma checkbox de **contrato firmado offline**. El sistema registra `acepto_terminos_at` + versión `2026-06-v1` como evidencia de onboarding, no como sustituto del documento legal firmado en papel.

---

## 9. Changelog de decisiones

| Fecha | Decisión |
|-------|----------|
| 2026-06 | Portal creador migra a tienda; núcleo solo administra |
| 2026-06 | Vanguardia absorvida en CRM; no ítem de sidebar |
| 2026-06 | `capabilities` JSONB en creadores para control admin sin nuevos roles |
| 2026-06 | `participante_contrato` para feria; honorarios no automáticos sin revisión |
| 2026-06 | Panel `/operadores-feria` + portal rep `/mi-feria` + `incentivo_ledger` / vista unificada |
| 2026-06 | Campo POS cableado a consignación feria (migración 67); banner contexto + bloqueo 409 en carrito |
| 2026-06 | Consignación admin descuenta almacén (migración 68); offline Campo valida feria antes de encolar venta |
| 2026-06 | Devolución consignación vía RPC atómica (migración 70); operador declara devolución en evento `en_curso`; alinea `validar_consignacion_feria` y arqueo |
| 2026-06 | Panel reps sin contrato feria activo en `/reps` y `/operadores-feria`; deep-link `?rep=` + guard anti-duplicado en UI |
| 2026-06 | Puente `incentivo_ledger` → `honorarios` (migración 71); admin prepara retención F29 sin emitir DTE automático |