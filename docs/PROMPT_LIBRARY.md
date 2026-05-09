# Libreria de Prompts — Enjambre Legado

> Prompts pre-construidos para dirigir agentes de IA con precision quirurgica.
> Cada prompt esta calibrado para el contexto especifico de este proyecto.

---

## 1. Inicializacion y Onboarding

### Inicializacion de Agente
```
IMPORTANTE: Estás operando dentro de 'Enjambre Legado', un ecosistema 
tecnológico de regeneración biocultural.

Antes de cualquier acción, lee OBLIGATORIAMENTE:
1. docs/CONSTITUTION.md
2. docs/AGENT_INSTRUCTIONS.md
3. docs/ARCHITECTURE.md

Tu estándar de calidad es el de un producto de LUJO. No aceptamos:
- Código mediocre o placeholders
- Falta de tipado TypeScript
- Componentes genéricos sin estética editorial
- RLS faltante en nuevas tablas

Si entiendes la misión, confirma con un resumen de los 7 mandamientos 
del desarrollador y espera instrucciones.
```

---

## 2. Mantenimiento y Evolucion Documental

### Refinar la Constitucion
```
Actúa como un Arquitecto de Sistemas y Curador Editorial.

Analiza docs/CONSTITUTION.md y compáralo con el estado actual del 
repositorio. Identifica inconsistencias entre la teoría y la 
implementación.

Para cada inconsistencia:
- Archivo afectado
- Que dice la documentación
- Que dice el código
- Acción correctiva propuesta

Mantén un tono de alta gama, técnico pero inspirado en la 
regeneración biocultural.
```

### Documentar un Nuevo Paquete/App
```
Estamos expandiendo el monorepo con un nuevo [Paquete/App] llamado 
'[Nombre]'.

Lee docs/ARCHITECTURE.md para entender el ecosistema.

Ahora, redacta un documento de especificación técnica que siga 
nuestro estándar:
1. Propósito y rol en el ecosistema
2. Stack tecnológico (debe ser compatible con el existente)
3. Estructura de archivos propuesta
4. Dependencias clave (verificar que existen en el workspace)
5. Integración con el flujo de datos del Enjambre
6. Variables de entorno necesarias
7. Plan de migración de datos si aplica
```

---

## 3. Ingenieria y Calidad de Codigo

### Auditoria de Estetica Premium (Frontend)
```
Revisa los componentes en apps/tienda/components.

Aplica los estándares de docs/AGENT_INSTRUCTIONS.md.

Para cada componente:
1. ¿Usa tokens semánticos (bg-background) o hex sueltos?
2. ¿Tiene micro-interacciones (GSAP)?
3. ¿Respeta la paleta oscura (#050505, #c9a227)?
4. ¿Tiene espaciado editorial generoso?
5. ¿Se ve como producto de lujo o como MVP genérico?

Critica DURAMENTE cualquier elemento que parezca un 'MVP genérico'.
Sugiere mejoras específicas con código de ejemplo.
```

### Auditoria de Seguridad y RLS
```
Actúa como un Experto en Seguridad de Supabase/Postgres.

Revisa las migraciones en packages/database/supabase/migrations/.

Para CADA tabla:
1. ¿Tiene RLS habilitado?
2. ¿Las políticas cubren todos los roles?
3. ¿Hay posibilidad de fuga de datos entre roles?
4. ¿Las funciones helper (current_role, is_gerente, 
   has_empresa_access) son correctas?

Genera un reporte con:
- Tablas seguras (verde)
- Tablas con riesgos menores (amarillo)
- Tablas con vulnerabilidades (rojo)
- SQL correctivo para cada problema encontrado
```

### Auditoria de Tipado TypeScript
```
Busca en todo el workspace:
1. Uso de `any` (prohibido por constitución)
2. `export default` en componentes (prohibido)
3. Props sin interfaz definida
4. catch(e) vacíos
5. Tipos implícitos (noImplicitAny)

Reporta por archivo con la corrección sugerida.
```

---

## 4. Operaciones Cirujano (Cambios Especificos)

### Agregar Nueva Tabla con RLS
```
Necesito crear una tabla '[nombre]' para [propósito].

Sigue ESTE PROCESO EXACTO:
1. Crear migración: packages/database/supabase/migrations/NN_nombre.sql
2. Incluir: CREATE TABLE con todos los campos
3. Incluir: ENABLE ROW LEVEL SECURITY
4. Incluir: Políticas para CADA rol que necesite acceso
5. Actualizar: docs/DATABASE_SCHEMA.md
6. Generar tipos: cd packages/database && pnpm db:typegen

Plantilla RLS:
- current_role() = 'gerente' → ve/modifica todo
- Rol propietario → ve solo sus datos (usando auth.uid())
- Publico → solo lectura si aplica

No generes la migración hasta que yo confirme los campos.
```

### Agregar Nueva Ruta a Tienda
```
Necesito crear la ruta '/[ruta]' en la tienda.

Antes de escribir código:
1. ¿Qué rol puede acceder? (público/admin)
2. ¿Qué datos necesita de Supabase?
3. ¿Es server component o client component?
4. ¿Qué componentes existentes puedo reutilizar?

Luego sigue:
- Si es pública: estética premium editorial (ver CONSTITUTION.md)
- Si es admin: funcional pero con consistencia visual
- Siempre: Named exports, TypeScript strict, Tailwind tokens
```

### Crear Nuevo Paquete Compartido
```
Necesito crear el paquete '@enjambre/[nombre]' para [propósito].

Verifica PRIMERO:
1. ¿Puede vivir en un paquete existente?
2. ¿Lo necesitan 2+ apps?
3. ¿Tiene dependencias circulares?

Estructura:
packages/[nombre]/
  src/
    index.ts       (re-exports)
    [modulos].ts   (lógica pura, sin framework)
  package.json     (name: @enjambre/[nombre])
  tsconfig.json

Reglas:
- Sin dependencias de framework (React, Next) si es lógica pura
- Usar Zod para validación de schemas
- Named exports exclusivamente
```

---

## 5. Expresion Creativa

### Generacion de Copys Editoriales
```
Necesito redactar los textos para la sección de [Sección] en la tienda.

Inspiración: 'Chiloé, geografía salvaje' y 'paciencia del panal'.

Reglas de tono:
- Evocador, premium y directo
- Sin clichés de marketing tradicional
- Referencias al bosque nativo, la miel virgen, la colmena
- Español neutro con toques de identidad chilota

Formato:
- Título (Cormorant Garamond, 48px+)
- Subtítulo (2-3 líneas)
- Cuerpo (párrafos cortos, máximo 3 líneas cada uno)
- CTA (imperativo elegante)
```

### Diseno de Feature Premium
```
Diseña la experiencia de [feature] siguiendo la estética editorial 
del Enjambre.

Requisitos:
1. Animación de entrada (GSAP): describir timeline
2. Transiciones entre estados: describir flujo
3. Micro-interacciones: hover, focus, active
4. Responsividad: mobile-first con breakpoints
5. Accesibilidad: contraste, focus indicators

Output esperado:
- Descripción narrativa de la experiencia
- Especificación de componentes necesarios
- Snippets de código GSAP para animaciones clave
```

---

## 6. Debugging y Troubleshooting

### Diagnostico de Error en Produccion
```
Estoy viendo este error en producción:
[PEGAR ERROR COMPLETO]

Antes de sugerir nada:
1. Identifica la app afectada (tienda/nucleo/campo/api/eirl)
2. Identifica el paquete involucrado (si aplica)
3. Verifica si es un error de tipos, runtime, o RLS
4. Verifica si afecta el flujo de datos (Supabase/Dexie)

Formato de respuesta:
- CAUSA RAÍZ: [explicación]
- ARCHIVO: [ruta exacta]
- LÍNEA: [número]
- FIX: [código correctivo]
- PREVENCIÓN: [cómo evitar que recurra]
```

### Diagnostico de RLS
```
El rol '[rol]' no puede [acción] en la tabla '[tabla]'.

Verifica:
1. ¿RLS está habilitado en la tabla?
2. ¿Existe una política para ese rol y esa acción?
3. ¿La política usa auth.uid() correctamente?
4. ¿El JWT del usuario tiene los claims correctos?

SQL de diagnóstico:
SELECT * FROM pg_policies WHERE tablename = '[tabla]';
```

---

## 7. Expansion del Ecosistema

### Evaluacion de Nueva Integracion
```
Queremos integrar [servicio] para [propósito].

Evalúa:
1. ¿En qué app vive? (tienda/api/nucleo)
2. ¿Afecta la base de datos? (nueva tabla/columna)
3. ¿Requiere variables de entorno nuevas?
4. ¿Tiene impacto en el offline-first?
5. ¿Es compatible con el stack actual?

Si es viable:
- Listar dependencias nuevas (verificar que no rompan nada)
- Diseñar la tabla de integración (sección 8 de DATABASE_SCHEMA.md)
- Definir el modo stub vs producción
```

---

*Estos prompts son herramientas de precision. Cada uno esta calibrado para el contexto exacto de Enjambre Legado.*
*Agregar nuevos prompts cuando se identifiquen patrones recurrentes.*
*Ultima actualizacion: Mayo 2026*
