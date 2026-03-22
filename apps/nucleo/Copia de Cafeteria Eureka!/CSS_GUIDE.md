# 🎨 Guía de CSS Centralizado - Proyecto Eureka

Este documento describe todas las clases CSS centralizadas disponibles en el proyecto Eureka para mantener un diseño consistente y elegante.

## 🎯 Clases Principales del Tema

### Tema Base
- `.eureka-theme` - Fondo negro con texto blanco
- `.eureka-header` - Header con fondo negro transparente y borde blanco sutil

### Botones
- `.eureka-btn-primary` - Botón principal con gradiente ámbar
- `.eureka-btn-outline` - Botón outline con borde blanco y hover sutil
- `.eureka-btn-white` - Botón blanco con texto negro

### Tarjetas
- `.eureka-card` - Tarjeta con fondo negro transparente y borde blanco sutil
- `.eureka-rounded` - Bordes completamente redondeados
- `.eureka-rounded-card` - Bordes redondeados de tarjeta

### Inputs y Labels
- `.eureka-input` - Campo de entrada con tema negro
- `.eureka-label` - Etiqueta de texto blanco

### Tipografía
- `.eureka-title` - Título en texto blanco y negrita
- `.eureka-title-large` - Título grande (4xl)
- `.eureka-title-medium` - Título mediano (2xl)
- `.eureka-text` - Texto principal blanco
- `.eureka-text-secondary` - Texto secundario gris claro
- `.eureka-text-muted` - Texto atenuado gris

### Iconos
- `.eureka-icon` - Icono en color ámbar
- `.eureka-icon-large` - Icono grande (w-8 h-8) en ámbar
- `.eureka-icon-medium` - Icono mediano (w-5 h-5) en ámbar

### Badges
- `.eureka-badge` - Badge con fondo blanco transparente
- `.eureka-badge-success` - Badge de éxito verde

### Pestañas
- `.eureka-tabs` - Contenedor de pestañas con tema negro
- `.eureka-tab` - Pestaña individual con estados activos

### Diálogos
- `.eureka-dialog` - Diálogo con fondo negro y bordes blancos

### Gradientes
- `.eureka-gradient-amber` - Gradiente ámbar base
- `.eureka-gradient-amber-hover` - Gradiente ámbar para hover

### Transiciones y Efectos
- `.eureka-transition` - Transición suave de 300ms
- `.eureka-hover-scale` - Efecto de escala en hover
- `.eureka-shadow` - Sombra con hover mejorado

### Espaciado
- `.eureka-spacing` - Espaciado estándar (py-6 px-4)
- `.eureka-spacing-large` - Espaciado grande (py-16 px-4)

### Contenedores
- `.eureka-container` - Contenedor máximo (max-w-7xl)
- `.eureka-container-medium` - Contenedor mediano (max-w-4xl)

### Grids
- `.eureka-grid` - Grid de 3 columnas responsive
- `.eureka-grid-cards` - Grid de tarjetas (1-2-3 columnas)

### Estados
- `.eureka-loading` - Estado de carga con animación

### Responsive
- `.eureka-responsive-text` - Texto responsive (6xl-7xl)
- `.eureka-responsive-spacing` - Espaciado responsive

## 📱 Ejemplos de Uso

### Botón Principal
```tsx
<Button className="eureka-btn-primary">
  Iniciar Sesión
</Button>
```

### Tarjeta con Título
```tsx
<Card className="eureka-card">
  <CardHeader>
    <CardTitle className="eureka-title">Mi Título</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="eureka-text-secondary">Contenido secundario</p>
  </CardContent>
</Card>
```

### Input con Label
```tsx
<div>
  <Label htmlFor="email" className="eureka-label">Email</Label>
  <Input
    id="email"
    className="eureka-input"
    placeholder="tu@email.com"
  />
</div>
```

### Header Completo
```tsx
<header className="eureka-header">
  <div className="eureka-container px-4">
    <div className="flex items-center justify-between eureka-spacing">
      {/* Contenido del header */}
    </div>
  </div>
</header>
```

### Grid de Tarjetas
```tsx
<div className="eureka-grid">
  <Card className="eureka-card">
    <CardHeader>
      <Star className="eureka-icon-large mx-auto mb-2" />
      <CardTitle className="text-center eureka-title">Título</CardTitle>
    </CardHeader>
  </Card>
</div>
```

## 🎨 Paleta de Colores

### Colores Principales
- **Negro**: `bg-black` (fondo principal)
- **Blanco**: `text-white` (texto principal)
- **Ámbar**: `text-amber-400` (acentos e iconos)

### Transparencias
- **Negro transparente**: `bg-black/40` (tarjetas)
- **Negro muy transparente**: `bg-black/90` (diálogos)
- **Blanco transparente**: `bg-white/10` (hovers)

### Grises
- **Gris claro**: `text-gray-300` (texto secundario)
- **Gris medio**: `text-gray-400` (texto atenuado)
- **Gris oscuro**: `text-gray-500` (texto muy atenuado)

## 🔧 Personalización

Para agregar nuevas clases, edita el archivo `src/app/globals.css` y agrega las nuevas clases en la sección de estilos centralizados:

```css
/* Nueva clase personalizada */
.eureka-custom {
  @apply bg-black/60 border-white/30 text-white;
}
```

## 📋 Reglas de Uso

1. **Siempre usa las clases centralizadas** en lugar de estilos inline
2. **Mantén la consistencia** usando las mismas clases para elementos similares
3. **Combina clases** para crear variaciones cuando sea necesario
4. **Documenta** cualquier nueva clase que agregues
5. **Prueba** en diferentes tamaños de pantalla

## 🚀 Beneficios

- ✅ **Consistencia visual** en todo el proyecto
- ✅ **Mantenimiento fácil** desde un solo archivo
- ✅ **Reutilización** de estilos comunes
- ✅ **Responsive design** integrado
- ✅ **Tema coherente** negro y ámbar
- ✅ **Performance** optimizado con Tailwind

---

*Esta guía debe mantenerse actualizada conforme se agreguen nuevas clases al proyecto.*
