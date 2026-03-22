#!/bin/bash

echo "🔧 Corrigiendo rutas para Hostinger..."

# Función para reemplazar rutas en archivos HTML
fix_paths() {
    local file="$1"
    echo "📝 Corrigiendo rutas en: $file"
    
    # Reemplazar rutas /_next/static por static
    sed -i '' 's|/_next/static|static|g' "$file"
    
    # Reemplazar rutas /_next/image por imágenes locales
    sed -i '' 's|/_next/image?url=%2F|/|g' "$file"
    
    # Reemplazar rutas absolutas por relativas
    sed -i '' 's|href="/static|href="static|g' "$file"
    sed -i '' 's|src="/static|src="static|g' "$file"
    
    # Corregir rutas de imágenes
    sed -i '' 's|srcSet="/static|srcSet="static|g' "$file"
    
    echo "✅ Rutas corregidas en: $file"
}

# Corregir todos los archivos HTML
for html_file in out/*.html; do
    if [ -f "$html_file" ]; then
        fix_paths "$html_file"
    fi
done

# Corregir archivos JavaScript también
for js_file in out/*.js; do
    if [ -f "$js_file" ]; then
        echo "📝 Corrigiendo rutas en: $js_file"
        sed -i '' 's|/_next/static|static|g' "$js_file"
        echo "✅ Rutas corregidas en: $js_file"
    fi
done

# Corregir archivos RSC
for rsc_file in out/*.rsc; do
    if [ -f "$rsc_file" ]; then
        echo "📝 Corrigiendo rutas en: $rsc_file"
        sed -i '' 's|/_next/static|static|g' "$rsc_file"
        echo "✅ Rutas corregidas en: $rsc_file"
    fi
done

echo ""
echo "🎯 Creando archivo .htaccess mejorado..."
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

echo "✅ ¡Rutas corregidas! Ahora regenerando ZIP..."
cd out && zip -r ../cafeteria-hostinger-fixed.zip . && cd ..

echo ""
echo "🎉 ¡Listo! Archivo 'cafeteria-hostinger-fixed.zip' creado con rutas corregidas."
echo "📁 Ahora sube este ZIP a Hostinger y debería funcionar correctamente."
