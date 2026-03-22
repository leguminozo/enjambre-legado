# 🚀 Guía de Despliegue en Hostinger Business Web Hosting

## 📋 Requisitos del Plan Business Web Hosting

- ✅ **Hosting compartido** con cPanel
- ✅ **PHP 8.0+** soportado
- ✅ **Base de datos MySQL** (hasta 100 bases)
- ✅ **SSL gratuito** incluido
- ✅ **Subdominios ilimitados**
- ✅ **Email profesional** incluido
- ✅ **Backup automático**
- ✅ **Soporte 24/7**

## 🔧 Configuración Paso a Paso

### 1. **Acceder a cPanel**
- Ve a tu panel de Hostinger
- Accede a **cPanel**
- Busca la sección **"Bases de datos"**

### 2. **Crear Base de Datos MySQL**
- En cPanel, ve a **"Bases de datos MySQL"**
- Crea una nueva base de datos:
  - **Nombre:** `verano_ecommerce`
  - **Usuario:** `verano_user`
  - **Contraseña:** `[contraseña-segura]`
  - **Host:** `localhost`

### 3. **Subir Archivos**
- Usa **File Manager** en cPanel o **FTP**
- Sube todos los archivos a la carpeta `public_html/admin/`
- Asegúrate de que la estructura sea:
  ```
  public_html/
  └── admin/
      ├── public/
      │   ├── index.php
      │   ├── .htaccess
      │   └── css/
      ├── src/
      ├── config/
      ├── install-hostinger.php
      ├── composer.json
      └── package.json
  ```

### 4. **Instalar Dependencias**
En cPanel Terminal o SSH:
```bash
cd public_html/admin
composer install
npm install
npm run build-prod
```

### 5. **Ejecutar Instalación Automática**
- Ve a tu navegador: `https://tudominio.com/admin/install-hostinger.php`
- Completa el formulario de instalación
- La aplicación se configurará automáticamente

### 6. **Configurar SSL/HTTPS**
- En cPanel, ve a **"SSL/TLS"**
- Activa el certificado gratuito
- Activa **"Forzar HTTPS"**

## 🌐 Configuración de Dominios

### **Opción 1: Subcarpeta en Dominio Principal**
- **URL:** `https://tudominio.com/admin`
- **Carpeta:** `/home/username/public_html/admin`

### **Opción 2: Subdominio Dedicado**
- **URL:** `https://admin.tudominio.com`
- **Carpeta:** `/home/username/admin.tudominio.com`

## 🔒 Configuración de Seguridad

### **SSL/HTTPS**
- Hostinger incluye SSL gratuito
- Activa **"Forzar HTTPS"** en cPanel

### **Firewall**
- Configura **ModSecurity** en cPanel
- Bloquea puertos innecesarios

### **Backup**
- Activa **backup automático** en cPanel
- Configura **backup manual** antes de cambios

## 📱 Configuración de Email

### **Email Profesional**
- Configura email: `admin@tudominio.com`
- Usa **Webmail** o **Thunderbird/Outlook**

### **Notificaciones del Sistema**
- Configura email para notificaciones de pedidos
- Email para recuperación de contraseñas

## 🚀 Comandos de Despliegue

### **Despliegue Inicial**
```bash
# 1. Subir archivos
# 2. Instalar dependencias
composer install
npm install

# 3. Construir assets
npm run build-prod

# 4. Ejecutar instalador web
# Visitar: https://tudominio.com/admin/install-hostinger.php
```

### **Actualizaciones**
```bash
# 1. Subir nuevos archivos
# 2. Actualizar dependencias
composer update
npm update

# 3. Reconstruir assets
npm run build-prod
```

## 🔍 Verificación del Despliegue

### **1. Verificar PHP**
```bash
php --version
php -m | grep -i mysql
```

### **2. Verificar Base de Datos**
```bash
mysql -u verano_user -p verano_ecommerce
SHOW TABLES;
```

### **3. Verificar Aplicación**
- Visita tu URL de administración
- Verifica que el login funcione
- Revisa los logs en cPanel

## 📊 Monitoreo y Mantenimiento

### **Logs de Aplicación**
- **cPanel > Logs > Error Logs**
- **cPanel > Logs > Access Logs**

### **Base de Datos**
- **cPanel > Bases de datos MySQL > phpMyAdmin**
- Monitorea el tamaño de la base de datos

### **Rendimiento**
- Usa **Google PageSpeed Insights**
- Monitorea **Core Web Vitals**

## 🆘 Solución de Problemas Comunes

### **Error: "Cannot connect to database"**
- Verifica credenciales en el archivo `.env`
- Confirma que la base de datos existe
- Verifica permisos del usuario

### **Error: "Class not found"**
```bash
composer dump-autoload
```

### **Error de permisos**
```bash
chmod 755 public_html/admin
chmod 644 public_html/admin/.htaccess
```

### **Error de SSL**
- Activa SSL en cPanel
- Verifica certificados

## 📞 Soporte de Hostinger

### **Canales de Soporte**
- **Chat en vivo** 24/7
- **Ticket de soporte**
- **Base de conocimientos**

### **Información Necesaria**
- Tu plan de hosting
- URL del problema
- Capturas de pantalla
- Logs de error

## 🎯 Checklist de Despliegue

- [ ] Base de datos MySQL creada
- [ ] Archivos subidos al servidor
- [ ] Dependencias instaladas (Composer + npm)
- [ ] Assets construidos
- [ ] Instalador ejecutado
- [ ] Base de datos inicializada
- [ ] Usuario admin creado
- [ ] SSL/HTTPS activado
- [ ] Aplicación funcionando
- [ ] Login admin funcionando
- [ ] Backup configurado
- [ ] Archivo de instalación eliminado

## 🚀 URLs de Acceso

- **Panel de administración:** `https://tudominio.com/admin`
- **Instalador:** `https://tudominio.com/admin/install-hostinger.php`
- **Credenciales:** admin@verano.com / password

## 🔧 Estructura del Proyecto

```
admin/
├── public/                 # Archivos públicos
│   ├── index.php          # Punto de entrada
│   ├── .htaccess          # Configuración Apache
│   └── css/               # CSS compilado
├── src/                   # Código fuente
│   ├── controllers/       # Controladores
│   ├── models/           # Modelos
│   ├── views/            # Vistas
│   └── database/         # Base de datos
├── config/               # Configuración
├── install-hostinger.php # Instalador automático
├── composer.json         # Dependencias PHP
└── package.json          # Dependencias Node.js
```

## 💡 Características Técnicas

- **Backend:** PHP 8.0+ con MySQL
- **Frontend:** HTML, CSS, JavaScript vanilla
- **Base de datos:** MySQL con PDO
- **Autenticación:** Sesiones PHP seguras
- **Estilos:** Tailwind CSS compilado
- **Enrutamiento:** .htaccess + PHP
- **Seguridad:** Headers HTTP, validación, escape

---

**¡Tu tienda ecommerce estará funcionando perfectamente en Hostinger Business Web Hosting! 🎉**
