# Plantillas de Correo: Supabase Auth (Flujo 1 — Identidad & Seguridad)

Este directorio contiene las **6 plantillas canónicas de correo electrónico** para el motor de autenticación interno de **Supabase Auth (GoTrue)**.

---

## 1. Alcance Operativo (Flujo 1 vs Flujo 2)

| Característica | Flujo 1: Supabase Auth (Este Directorio) | Flujo 2: Notificaciones Transaccionales |
| :--- | :--- | :--- |
| **Objetivo** | Identidad, acceso, recuperación y seguridad de cuentas. | Comunicaciones de negocio (pedidos, envíos, reseñas, alertas). |
| **Disparadores** | `supabase.auth.signUp()`, `signInWithOtp()`, `resetPasswordForEmail()`, etc. | Mutaciones en BFF Núcleo (`notification_queue`, Resend API). |
| **Quién genera el HTML** | El motor de autenticación interno de Supabase. | El BFF de Núcleo (`sendNotificationEmail()`). |
| **Dónde se configuran** | **Panel de Supabase:** `Authentication` → `Email Templates`. | Tabla Postgres `email_templates` / Centro de Correos. |
| **Tokens criptográficos** | Generados internamente por GoTrue de forma segura y efímera. | Datos de negocio (tracking, totales, items de pedidos). |

---

## 2. Inventario de Plantillas y Mapeo en Supabase

Copia y pega el contenido del archivo HTML y el asunto recomendado en la sección correspondiente dentro de **Supabase Dashboard → Authentication → Email Templates**:

| # | Plantilla en Supabase | Archivo HTML | Asunto Recomendado | Variables Disponibles |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Confirm signup** | [`confirm-signup.html`](./confirm-signup.html) | `Activa tu cuenta · Enjambre Legado` | `{{ .ConfirmationURL }}`, `{{ .Token }}`, `{{ .SiteURL }}`, `{{ .Email }}` |
| **2** | **Invite user** | [`invite-user.html`](./invite-user.html) | `Invitación de acceso · Enjambre Legado` | `{{ .ConfirmationURL }}`, `{{ .Token }}`, `{{ .SiteURL }}`, `{{ .Email }}` |
| **3** | **Magic link** | [`magic-link.html`](./magic-link.html) | `Tu enlace de acceso · Enjambre Legado` | `{{ .ConfirmationURL }}`, `{{ .Token }}`, `{{ .SiteURL }}`, `{{ .Email }}` |
| **4** | **Change email address** | [`change-email-address.html`](./change-email-address.html) | `Confirma el cambio de correo · Enjambre Legado` | `{{ .ConfirmationURL }}`, `{{ .Token }}`, `{{ .SiteURL }}`, `{{ .Email }}`, `{{ .NewEmail }}` |
| **5** | **Reset password** | [`reset-password.html`](./reset-password.html) | `Restablece tu contraseña · Enjambre Legado` | `{{ .ConfirmationURL }}`, `{{ .Token }}`, `{{ .SiteURL }}`, `{{ .Email }}` |
| **6** | **Reauthentication** | [`reauthentication.html`](./reauthentication.html) | `Código de verificación de seguridad · Enjambre Legado` | `{{ .Token }}`, `{{ .SiteURL }}`, `{{ .Email }}` |

---

## 3. Arquitectura Dual: Modo Claro & Modo Oscuro Automático

Las plantillas están diseñadas para adaptarse instantáneamente a la preferencia del sistema operativo o cliente de correo del usuario (`prefers-color-scheme: dark / light`):

### En Clientes con Modo Claro:
- Fondo exterior cálido piedra caliza: `#F7F5F0`.
- Tarjeta central blanca pura `#FFFFFF` con esquinas redondeadas (18px) y borde neutro sutil `#E7E1D6`.
- Encabezados en tipografía serif editorial `#1C1917`.
- Acentos y botones en oro miel ámbar `#B4832F`.

### En Clientes con Modo Oscuro (Apple Mail, iOS, macOS, Outlook App, Gmail moderno):
- Se activan dinámicamente las directivas `@media (prefers-color-scheme: dark)` y selectores `[data-ogsc]`.
- Fondo exterior negro carbón obsidiana: `#0C0A09`.
- Tarjeta central en tono oscuro elevado: `#171412` con borde `#2D261F`.
- Tipografía en plata y blanco cálido de alta legibilidad: `#F5F2EB` y `#D1CCC2`.
- Botones de acción en oro líquido luminiscente `#D8A64E` con texto oscuro de alto contraste `#0C0A09`.

---

## 4. Doble Canal de Autenticación (Botón CTA + OTP de 6 Dígitos)

Para maximizar la ergonomía y evitar fricción cuando el usuario abre el correo en su ordenador mientras ingresa desde el teléfono (o viceversa):
1. **Botón Principal Interactivo:** Utiliza `{{ .ConfirmationURL }}` para autenticar con un solo clic.
2. **Caja Destacada OTP:** Expone `{{ .Token }}` con espaciado monoespaciado para que el usuario pueda ingresar el código numérico manualmente si lo prefiere.
3. **Enlace de Respaldo:** Proporciona la URL en texto plano en caso de que el cliente de correo desactive los botones HTML.

---

## 5. Reglas de Voz y Estilo Sagradas

1. **Cero "enlace mágico":** En toda la interfaz y comunicaciones se utiliza *"Enlace de acceso directo"* o *"Código de acceso"*.
2. **Cero "cosecha":** Se utiliza *"recolección"* o términos neutros de identidad.
3. **Cero jerga criptográfica o técnica en textos de usuario:** Nada de `SHA-256`, `UUID`, `RLS` ni nombres de migraciones o scripts.
4. **Poder silencioso y elegancia discreta:** Comunicación sobria, formal, concisa y orientada a la seguridad del integrante.
