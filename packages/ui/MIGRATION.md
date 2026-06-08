# Migración a UI Centralizado

## Qué se centralizó

### ✅ 1. Utilidad `cn()` (ClassNames)

**Antes** (en `apps/nucleo/src/lib/utils.ts`):
```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Ahora**:
```typescript
import { cn } from '@enjambre/ui';
```

### ✅ 2. Iconos Lucide

**Antes**:
```typescript
import { SearchIcon, CheckIcon } from 'lucide-react';
```

**Ahora**:
```typescript
import { SearchIcon, CheckIcon } from '@enjambre/ui';
```

**Ventaja:** Control centralizado de qué iconos se usan en todo el proyecto.

### ✅ 3. Toast Notifications

**Antes** (multiples formas en diferentes apps):
```typescript
// apps/nucleo (legacy)
import { toast } from 'sonner';

// apps/tienda
import { useToast } from '@/hooks/use-toast';
```

**Ahora**:
```typescript
import { toast } from '@enjambre/ui';

toast('Success!', { type: 'success' });
toast('Error!', { type: 'error' });
```

### ✅ 4. Componentes de Diálogo

**Antes** (duplicado en cada app):
```typescript
// apps/nucleo/src/components/ui/dialog.tsx
// apps/tienda/src/components/ui/dialog.tsx
```

**Ahora**:
```typescript
import { Dialog, DialogTrigger, DialogContent } from '@enjambre/ui';
```

### ✅ 5. Dropdown Menu

**Antes** (duplicado):
```typescript
// apps/*/src/components/ui/dropdown-menu.tsx
```

**Ahora**:
```typescript
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@enjambre/ui';
```

---

## Cómo migrar tu código

### Paso 1: Reemplazar imports de `cn`

```diff
- import { cn } from "@/lib/utils";
+ import { cn } from "@enjambre/ui";
```

### Paso 2: Reemplazar iconos

```diff
- import { SearchIcon } from "lucide-react";
+ import { SearchIcon } from "@enjambre/ui";
```

### Paso 3: Reemplazar toast

```diff
- import { toast } from "sonner";
+ import { toast } from "@enjambre/ui";
```

### Paso 4: Reemplazar componentes UI

```diff
- import { Dialog, DialogContent } from "@/components/ui/dialog";
+ import { Dialog, DialogContent } from "@enjambre/ui";
```

---

## Dependencias eliminadas de apps

Estas dependencias ahora están en `packages/ui`:

- `clsx`
- `tailwind-merge`
- `sonner`
- `@radix-ui/react-dialog`
- `@radix-ui/react-dropdown-menu`
- `lucide-react`

**Acción:** Puedes eliminarlas de `apps/*/package.json` si ya no se usan directamente.

---

## Beneficios

1. **Consistencia:** Mismo comportamiento en todas las apps
2. **Mantenimiento:** Cambios en un solo lugar
3. **Performance:** Menos duplicación de código
4. **Tamaño:** Tree-shaking elimina lo que no se usa

---

## Archivos creados/modificados

```
packages/ui/
├── src/
│  ├── icons/          # Nuevo
│  │  └── index.ts
│  ├── hooks/          # Nuevo
│  │  ├── index.ts
│  │  └── use-toast.ts
│  ├── components/
│  │  ├── dialog.tsx        # Nuevo
│  │  └── dropdown-menu.tsx # Nuevo
│  └── lib/
│     └── utils.ts          # Nuevo (cn function)
├── README.md        # Documentación
└── MIGRATION.md     # Este archivo
```
