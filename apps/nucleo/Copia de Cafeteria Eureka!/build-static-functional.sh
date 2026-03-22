#!/bin/bash

echo "🚀 Construyendo versión estática funcional de Eureka!..."

# Ir a la carpeta de la versión estática
cd static-version

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Construir la aplicación
echo "🔨 Construyendo aplicación..."
npm run build

# Verificar que se creó la carpeta out
if [ -d "out" ]; then
    echo "✅ Construcción exitosa! Carpeta 'out' creada."
    
    # Crear archivo .htaccess para Hostinger
    echo "⚙️ Creando .htaccess para Hostinger..."
    cat > out/.htaccess << 'EOF'
RewriteEngine On
RewriteBase /

# Redirigir a index.html para rutas de SPA
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.html [L]

# Configuración de caché para archivos estáticos
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType font/woff2 "access plus 1 year"
</IfModule>

# Compresión GZIP
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
    AddOutputFilterByType DEFLATE font/woff2
</IfModule>

# Headers de seguridad
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
</IfModule>
EOF

    # Crear archivo README para Hostinger
    echo "📖 Creando README para Hostinger..."
    cat > out/README-HOSTINGER.md << 'EOF'
# 🚀 Eureka! Café - Versión Estática Funcional

## ✨ Características Funcionales:

### 🔐 **Sistema de Usuarios Completo:**
- ✅ **Registro de usuarios** con formulario completo
- ✅ **Login funcional** con usuarios de prueba
- ✅ **Sesiones persistentes** usando localStorage
- ✅ **Perfil de usuario** con información personal

### 🛒 **Carrito de Compras Funcional:**
- ✅ **Agregar productos** desde el catálogo
- ✅ **Modificar cantidades** con botones + y -
- ✅ **Eliminar productos** del carrito
- ✅ **Persistencia del carrito** entre sesiones
- ✅ **Checkout funcional** con confirmación de pedido

### 🎯 **Club de Fidelización:**
- ✅ **Sistema de puntos** funcional
- ✅ **Niveles de usuario** (Bronce, Plata, Oro, Platino, Diamante)
- ✅ **Beneficios por puntos** claramente definidos
- ✅ **Progreso visual** hacia el siguiente nivel
- ✅ **Puntos de bienvenida** automáticos

### 📱 **Navegación Completa:**
- ✅ **Página principal** con estado de usuario
- ✅ **Catálogo de productos** con filtros por categoría
- ✅ **Página Sobre Nosotros** con información completa
- ✅ **Página de fidelización** con sistema de puntos
- ✅ **Carrito funcional** con gestión completa

## 🌐 **Cómo subir a Hostinger:**

### **Opción 1: Subida directa**
1. Accede a tu panel de Hostinger
2. Ve a "File Manager" o "Administrador de archivos"
3. Navega a la carpeta `public_html`
4. Sube TODOS los archivos de la carpeta `out`

### **Opción 2: FTP**
1. Usa FileZilla o similar
2. Conéctate a tu servidor Hostinger
3. Sube el contenido de la carpeta `out` a `public_html`

## ⚠️ **Importante:**
- **NO subas** la carpeta `out` completa
- **Sube SOLO el contenido** de `out` a `public_html`
- **Asegúrate** de que `index.html` esté en la raíz

## 🔧 **Funcionalidades Técnicas:**
- **localStorage** para persistencia de datos
- **React Hooks** para estado y efectos
- **Navegación SPA** con Next.js
- **Responsive design** con Tailwind CSS
- **Iconos** con Lucide React

## 🎮 **Usuarios de Prueba:**
- **admin@eureka.cl** / admin123 (Administrador)
- **cliente@eureka.cl** / cliente123 (Cliente)
- **test@eureka.cl** / test123 (Usuario Test)

## 🚀 **Resultado:**
Tu cafetería Eureka! estará **100% funcional** en Hostinger con:
- Sistema de usuarios completo
- Carrito de compras funcional
- Club de fidelización operativo
- Todas las páginas funcionando
- Diseño responsive y moderno

¡Tu cafetería estará online y funcional! ☕✨
EOF

    # Crear ZIP para Hostinger
    echo "📦 Creando archivo ZIP para Hostinger..."
    cd out && zip -r ../eureka-cafe-functional.zip . && cd ..
    
    echo ""
    echo "🎉 ¡Versión estática funcional creada exitosamente!"
    echo "📁 Archivo ZIP: 'eureka-cafe-functional.zip'"
    echo "🚀 Ahora puedes subir este ZIP a Hostinger"
    echo "✨ Tu cafetería tendrá TODAS las funcionalidades trabajando"
    
else
    echo "❌ Error: No se pudo crear la carpeta 'out'"
    echo "🔍 Revisa los errores de construcción arriba"
    exit 1
fi

# Volver al directorio original
cd ..


