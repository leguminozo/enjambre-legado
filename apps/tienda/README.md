# 🍯 Verano Ecommerce - Panel de Administración

Una aplicación web completa de ecommerce con panel de administración personalizado, inspirada en las mejores prácticas de gestión de tiendas online.

## ✨ Características

- **Dashboard completo** con métricas en tiempo real
- **Gestión de productos** con inventario y categorías
- **Sistema de pedidos** con seguimiento completo
- **Base de clientes** con segmentación avanzada
- **Colecciones** para organizar productos
- **Analytics** y reportes detallados
- **Interfaz moderna** y responsive
- **Autenticación segura** con JWT
- **API RESTful** completa

## 🚀 Tecnologías

### Backend
- **Node.js** con Express
- **JWT** para autenticación
- **REST API** con validaciones
- **Middleware** de seguridad (Helmet, CORS)

### Frontend
- **React 18** con Hooks
- **Tailwind CSS** para estilos
- **Lucide React** para iconos
- **Recharts** para gráficos
- **Axios** para HTTP requests
- **React Router** para navegación

## 📦 Instalación

### Prerrequisitos
- Node.js 16+ 
- npm o yarn

### 1. Clonar el repositorio
```bash
git clone <tu-repositorio>
cd verano-ecommerce
```

### 2. Instalar dependencias del servidor
```bash
npm install
```

### 3. Instalar dependencias del cliente
```bash
cd client
npm install
cd ..
```

### 4. Configurar variables de entorno
Crear un archivo `.env` en la raíz del proyecto:
```env
NODE_ENV=development
PORT=5000
JWT_SECRET=tu-clave-secreta-aqui
CLIENT_URL=http://localhost:3000
```

### 5. Ejecutar la aplicación

#### Opción 1: Ejecutar todo junto
```bash
npm run dev
```

#### Opción 2: Ejecutar por separado
```bash
# Terminal 1 - Servidor
npm run server

# Terminal 2 - Cliente
npm run client
```

## 🔐 Credenciales de acceso

- **Email:** admin@verano.com
- **Contraseña:** password

## 🌐 URLs de acceso

- **Panel de administración:** http://localhost:3000
- **API del servidor:** http://localhost:5000
- **Documentación de la API:** http://localhost:5000/api/health

## 📱 Funcionalidades principales

### Dashboard
- Métricas de ventas y sesiones
- Gráficos interactivos
- Resumen de rendimiento
- Tarjetas informativas

### Productos
- CRUD completo de productos
- Gestión de inventario
- Categorización
- Imágenes y descripciones

### Pedidos
- Seguimiento de pedidos
- Estados de preparación
- Información de clientes
- Historial completo

### Clientes
- Base de datos de clientes
- Segmentación por ubicación
- Historial de compras
- Estado de suscripciones

### Colecciones
- Organización de productos
- Condiciones personalizables
- Gestión de catálogos

## 🛠️ Estructura del proyecto

```
verano-ecommerce/
├── server/                 # Backend Node.js
│   ├── routes/            # Rutas de la API
│   │   ├── auth.js        # Autenticación
│   │   ├── dashboard.js   # Dashboard
│   │   ├── products.js    # Productos
│   │   ├── orders.js      # Pedidos
│   │   ├── customers.js   # Clientes
│   │   ├── collections.js # Colecciones
│   │   └── analytics.js   # Analytics
│   └── index.js           # Servidor principal
├── client/                # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes reutilizables
│   │   ├── pages/         # Páginas principales
│   │   ├── contexts/      # Contextos de React
│   │   └── App.js         # Aplicación principal
│   ├── public/            # Archivos estáticos
│   └── package.json       # Dependencias del cliente
├── package.json           # Dependencias del servidor
└── README.md              # Este archivo
```

## 🔧 Scripts disponibles

```bash
# Instalar todas las dependencias
npm run install-all

# Ejecutar en modo desarrollo
npm run dev

# Solo el servidor
npm run server

# Solo el cliente
npm run client

# Construir para producción
npm run build

# Ejecutar en producción
npm start
```

## 📊 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/verify` - Verificar token
- `POST /api/auth/logout` - Cerrar sesión

### Dashboard
- `GET /api/dashboard` - Datos del dashboard
- `GET /api/dashboard/metrics/:period` - Métricas por período

### Productos
- `GET /api/products` - Listar productos
- `POST /api/products` - Crear producto
- `PUT /api/products/:id` - Actualizar producto
- `DELETE /api/products/:id` - Eliminar producto

### Pedidos
- `GET /api/orders` - Listar pedidos
- `POST /api/orders` - Crear pedido
- `PUT /api/orders/:id` - Actualizar pedido
- `DELETE /api/orders/:id` - Eliminar pedido

### Clientes
- `GET /api/customers` - Listar clientes
- `POST /api/customers` - Crear cliente
- `PUT /api/customers/:id` - Actualizar cliente
- `DELETE /api/customers/:id` - Eliminar cliente

### Colecciones
- `GET /api/collections` - Listar colecciones
- `POST /api/collections` - Crear colección
- `PUT /api/collections/:id` - Actualizar colección
- `DELETE /api/collections/:id` - Eliminar colección

## 🎨 Personalización

### Colores
Los colores principales se pueden personalizar en `client/tailwind.config.js`:

```javascript
colors: {
  primary: {
    50: '#fef7ee',
    100: '#fdedd6',
    // ... más variantes
  }
}
```

### Estilos
Los estilos personalizados están en `client/src/index.css` con clases utilitarias.

## 🚀 Despliegue en Hostinger Business

### **Configuración Automatizada**
```bash
# Dar permisos al script
chmod +x hostinger-deploy.sh

# Ejecutar despliegue automático
./hostinger-deploy.sh
```

### **Configuración Manual**

#### 1. **Preparar el proyecto**
```bash
npm run setup:hostinger
```

#### 2. **Configurar en cPanel**
- **Node.js:** Crear aplicación en cPanel
- **Base de datos:** MySQL con usuario dedicado
- **SSL:** Activar certificado gratuito

#### 3. **Variables de entorno**
```env
NODE_ENV=production
PORT=3000
JWT_SECRET=tu-clave-super-secreta
DB_USER=verano_user
DB_PASSWORD=tu-contraseña
DB_NAME=verano_ecommerce
DB_HOST=localhost
DB_PORT=3306
CLIENT_URL=https://tudominio.com
```

#### 4. **Inicializar base de datos**
```bash
NODE_ENV=production node server/scripts/setup-db.js
```

### **Gestión con PM2**
```bash
# Iniciar aplicación
pm2 start ecosystem.config.js --env production

# Ver estado
pm2 status

# Ver logs
pm2 logs verano-ecommerce

# Reiniciar
pm2 restart verano-ecommerce
```

### **URLs de Acceso**
- **Panel admin:** `https://tudominio.com/admin`
- **API:** `https://tudominio.com/admin/api`
- **Credenciales:** admin@verano.com / password

### **Documentación Completa**
Ver `hostinger-setup.md` para instrucciones detalladas paso a paso.

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:

1. Revisa la documentación
2. Busca en los issues existentes
3. Crea un nuevo issue con detalles

## 🔮 Roadmap

- [ ] Integración con pasarelas de pago
- [ ] Sistema de notificaciones push
- [ ] App móvil nativa
- [ ] Integración con redes sociales
- [ ] Sistema de fidelización
- [ ] Reportes avanzados
- [ ] Integración con ERP

---

**Desarrollado con ❤️ para Verano Ecommerce**

*Una solución completa y personalizable para tu negocio online*
