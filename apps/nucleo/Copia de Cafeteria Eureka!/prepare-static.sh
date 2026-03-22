#!/bin/bash

echo "🚀 Preparando archivos estáticos para Hostinger..."

# Crear carpeta out si no existe
mkdir -p out

# Copiar archivos HTML y estáticos
echo "📁 Copiando archivos HTML..."
cp -r .next/server/app/*.html out/
cp -r .next/server/app/*.js out/
cp -r .next/server/app/*.rsc out/

# Copiar archivos estáticos (CSS, JS, imágenes)
echo "🎨 Copiando archivos estáticos..."
cp -r .next/static out/static

# Copiar archivos públicos
echo "🌐 Copiando archivos públicos..."
cp -r public/* out/

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
</IfModule>
EOF

# Crear archivo README para Hostinger
echo "📖 Creando README para Hostinger..."
cat > out/README-HOSTINGER.md << 'EOF'
# 🚀 Cafetería - Archivos para Hostinger

## 📁 Contenido de esta carpeta:
- **Archivos HTML**: Todas las páginas de tu aplicación
- **Archivos estáticos**: CSS, JavaScript, imágenes
- **Archivos públicos**: Logo, favicon, etc.

## 🌐 Cómo subir a Hostinger:

### Opción 1: Subida directa
1. Accede a tu panel de Hostinger
2. Ve a "File Manager" o "Administrador de archivos"
3. Navega a la carpeta `public_html`
4. Sube TODOS los archivos de esta carpeta

### Opción 2: FTP
1. Usa un cliente FTP (FileZilla, etc.)
2. Conéctate a tu servidor Hostinger
3. Sube todos los archivos a `public_html`

## ⚠️ Importante:
- **NO subas la carpeta `out` completa**
- **Sube SOLO el contenido** de la carpeta `out`
- Asegúrate de que `index.html` esté en la raíz

## 🔧 Si algo no funciona:
1. Verifica que todos los archivos estén subidos
2. Revisa que `.htaccess` esté presente
3. Contacta al soporte de Hostinger

¡Tu cafetería estará online! ☕
EOF

echo "✅ ¡Archivos estáticos preparados en la carpeta 'out'!"
echo "📁 Contenido de la carpeta 'out':"
ls -la out/

echo ""
echo "🚀 Ahora puedes subir el contenido de la carpeta 'out' a Hostinger!"
echo "📖 Lee 'out/README-HOSTINGER.md' para instrucciones detalladas."
