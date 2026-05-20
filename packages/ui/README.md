# @enjambre/ui

Componentes y utilidades compartidas para el ecosistema Enjambre Legado.

## Instalación

```bash
pnpm add @enjambre/ui
```

## Uso

### 1. Utilidad `cn` (ClassNames)

```typescript
import { cn } from '@enjambre/ui';

// Combinar clases condicionalmente
<div className={cn('base-class', isActive && 'active', className)} />
```

### 2. Iconos (Lucide)

Todos los iconos de Lucide están disponibles:

```typescript
import { SearchIcon, CheckIcon, ChevronDownIcon } from '@enjambre/ui';

function MyComponent() {
  return <SearchIcon className="w-4 h-4" />;
}
```

**Iconos disponibles:** Ver `packages/ui/src/icons/index.ts`

### 3. Componentes de Diálogo

```typescript
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from '@enjambre/ui';

function MyDialog() {
  return (
    <Dialog>
      <DialogTrigger>Open</DialogTrigger>
      <DialogContent>
        <DialogTitle>Title</DialogTitle>
        <p>Content</p>
      </DialogContent>
    </Dialog>
  );
}
```

### 4. Dropdown Menu

```typescript
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@enjambre/ui';

function MyDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>Options</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Item 1</DropdownMenuItem>
        <DropdownMenuItem>Item 2</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### 5. Toast Notifications

```typescript
import { toast } from '@enjambre/ui';

function MyComponent() {
  const handleSuccess = () => {
    toast('Operación exitosa', { type: 'success' });
  };

  const handleError = () => {
    toast('Error ocurrido', { type: 'error' });
  };

  return (
    <div>
      <button onClick={handleSuccess}>Success</button>
      <button onClick={handleError}>Error</button>
    </div>
  );
}
```

**Tipos de toast:** `default`, `success`, `error`, `warning`, `info`

### 6. Utilidades de Formato

```typescript
import { formatDate, formatDateShort } from '@enjambre/ui';

formatDate(new Date()); // "19 de mayo de 2026"
formatDateShort(new Date()); // "19/05/2026"
```

### 7. Manejo de Errores

```typescript
import { friendlySupabaseError, friendlyApiError } from '@enjambre/ui';

try {
  // ... código
} catch (error) {
  const message = friendlySupabaseError(error);
  toast(message, { type: 'error' });
}
```

## Componentes Disponibles

- **Básicos:** `Button`, `Badge`, `Input`, `Textarea`, `Card`
- **Layout:** `StatCard`, `SectionHeader`
- **Feedback:** `GrainOverlay`, `ToastProvider`
- **Diálogo:** `Dialog`, `DialogTrigger`, `DialogContent`, etc.
- **Dropdown:** `DropdownMenu`, `DropdownMenuItem`, etc.
- **Iconos:** Todos los de Lucide

## Estilos

Los componentes usan **Tailwind CSS** con tokens semánticos:

- `bg-background`, `bg-surface`, `bg-surface-raised`
- `text-foreground`, `text-muted-foreground`
- `border-border`
- `primary`, `accent`, `destructive`

Ver `tokens.css` para la lista completa.

## Convenciones

- **Named exports only:** `export function Component`
- **Sin `any`:** Usar `unknown` + type guards
- **Props con interfaz:** `interface ComponentProps`
- **Sin comentarios** a menos que expliquen el "por qué"
