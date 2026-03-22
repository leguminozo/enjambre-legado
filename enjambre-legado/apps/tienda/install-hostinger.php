<?php
/**
 * Script de instalación para Hostinger Business Web Hosting
 * Ejecutar desde el navegador: https://tudominio.com/admin/install-hostinger.php
 */

// Configuración de errores para instalación
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Verificar si ya está instalado
if (file_exists('.env') && file_exists('config/config.php')) {
    die('❌ La aplicación ya está instalada. Elimina este archivo por seguridad.');
}

// Procesar formulario de instalación
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $installResult = processInstallation($_POST);
}

?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Instalación - Verano Ecommerce</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body class="bg-gray-50 min-h-screen font-sans">
    <div class="max-w-4xl mx-auto py-8 px-4">
        <!-- Header -->
        <div class="text-center mb-8">
            <div class="mx-auto h-20 w-20 bg-amber-500 rounded-full flex items-center justify-center mb-4">
                <svg class="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            </div>
            <h1 class="text-4xl font-bold text-gray-900 mb-2">Instalación de Verano Ecommerce</h1>
            <p class="text-lg text-gray-600">Configuración para Hostinger Business Web Hosting</p>
        </div>

        <?php if (isset($installResult)): ?>
            <!-- Resultado de la instalación -->
            <div class="mb-8">
                <?php if ($installResult['success']): ?>
                    <div class="bg-green-50 border border-green-200 rounded-md p-6">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <svg class="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                            </div>
                            <div class="ml-3">
                                <h3 class="text-lg font-medium text-green-800">¡Instalación Completada!</h3>
                                <div class="mt-2 text-green-700">
                                    <p>Tu tienda ecommerce está lista para usar.</p>
                                    <p class="mt-2"><strong>URL del panel:</strong> <a href="/admin/" class="underline">https://tudominio.com/admin/</a></p>
                                    <p><strong>Credenciales:</strong> admin@verano.com / password</p>
                                </div>
                            </div>
                        </div>
                    </div>
                <?php else: ?>
                    <div class="bg-red-50 border border-red-200 rounded-md p-6">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <svg class="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </div>
                            <div class="ml-3">
                                <h3 class="text-lg font-medium text-red-800">Error en la instalación</h3>
                                <div class="mt-2 text-red-700">
                                    <p><?php echo htmlspecialchars($installResult['message']); ?></p>
                                </div>
                            </div>
                        </div>
                    </div>
                <?php endif; ?>
            </div>
        <?php endif; ?>

        <!-- Formulario de instalación -->
        <div class="bg-white shadow-lg rounded-lg">
            <div class="px-6 py-4 border-b border-gray-200">
                <h2 class="text-xl font-semibold text-gray-900">Configuración de la aplicación</h2>
            </div>
            
            <form method="POST" class="p-6 space-y-6">
                <!-- Configuración de la base de datos -->
                <div>
                    <h3 class="text-lg font-medium text-gray-900 mb-4">Base de Datos MySQL</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Host de la base de datos</label>
                            <input type="text" name="db_host" value="localhost" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Puerto</label>
                            <input type="number" name="db_port" value="3306" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre de la base de datos</label>
                            <input type="text" name="db_name" value="verano_ecommerce" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                            <input type="text" name="db_user" value="verano_user" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500">
                        </div>
                        <div class="md:col-span-2">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                            <input type="password" name="db_pass" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500">
                        </div>
                    </div>
                </div>

                <!-- Configuración de la aplicación -->
                <div>
                    <h3 class="text-lg font-medium text-gray-900 mb-4">Configuración de la aplicación</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">URL de tu sitio</label>
                            <input type="url" name="app_url" value="https://tudominio.com" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Clave secreta JWT</label>
                            <input type="text" name="jwt_secret" value="<?php echo generateRandomString(32); ?>" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500">
                        </div>
                    </div>
                </div>

                <!-- Configuración del administrador -->
                <div>
                    <h3 class="text-lg font-medium text-gray-900 mb-4">Cuenta de administrador</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                            <input type="text" name="admin_name" value="Administrador" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input type="email" name="admin_email" value="admin@verano.com" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                            <input type="password" name="admin_password" value="password" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
                            <input type="password" name="admin_password_confirm" value="password" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500">
                        </div>
                    </div>
                </div>

                <!-- Botón de instalación -->
                <div class="flex justify-end">
                    <button type="submit" class="bg-amber-600 text-white px-6 py-2 rounded-md hover:bg-amber-700 focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors duration-200">
                        Instalar aplicación
                    </button>
                </div>
            </form>
        </div>

        <!-- Información adicional -->
        <div class="mt-8 bg-blue-50 border border-blue-200 rounded-md p-6">
            <h3 class="text-lg font-medium text-blue-800 mb-2">Información importante</h3>
            <ul class="text-blue-700 space-y-1 text-sm">
                <li>• Asegúrate de que tu base de datos MySQL esté creada en cPanel</li>
                <li>• El usuario de la base de datos debe tener permisos completos</li>
                <li>• Después de la instalación, elimina este archivo por seguridad</li>
                <li>• Cambia las credenciales por defecto después del primer login</li>
            </ul>
        </div>
    </div>

    <script>
        // Validación del formulario
        document.querySelector('form').addEventListener('submit', function(e) {
            const password = document.querySelector('input[name="admin_password"]').value;
            const confirmPassword = document.querySelector('input[name="admin_password_confirm"]').value;
            
            if (password !== confirmPassword) {
                e.preventDefault();
                alert('Las contraseñas no coinciden');
                return false;
            }
            
            if (password.length < 6) {
                e.preventDefault();
                alert('La contraseña debe tener al menos 6 caracteres');
                return false;
            }
        });
    </script>
</body>
</html>

<?php
/**
 * Procesar la instalación
 */
function processInstallation($data) {
    try {
        // Validar datos
        if (empty($data['db_host']) || empty($data['db_name']) || empty($data['db_user']) || empty($data['db_pass'])) {
            return ['success' => false, 'message' => 'Todos los campos de la base de datos son requeridos'];
        }
        
        if ($data['admin_password'] !== $data['admin_password_confirm']) {
            return ['success' => false, 'message' => 'Las contraseñas no coinciden'];
        }
        
        if (strlen($data['admin_password']) < 6) {
            return ['success' => false, 'message' => 'La contraseña debe tener al menos 6 caracteres'];
        }
        
        // Probar conexión a la base de datos
        $dsn = "mysql:host={$data['db_host']};port={$data['db_port']};charset=utf8mb4";
        $pdo = new PDO($dsn, $data['db_user'], $data['db_pass']);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // Crear base de datos si no existe
        $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$data['db_name']}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        $pdo->exec("USE `{$data['db_name']}`");
        
        // Crear tablas
        createTables($pdo);
        
        // Crear usuario administrador
        createAdminUser($pdo, $data);
        
        // Crear archivo de configuración
        createConfigFile($data);
        
        // Crear archivo .env
        createEnvFile($data);
        
        return ['success' => true, 'message' => 'Instalación completada exitosamente'];
        
    } catch (Exception $e) {
        return ['success' => false, 'message' => 'Error: ' . $e->getMessage()];
    }
}

/**
 * Crear tablas de la base de datos
 */
function createTables($pdo) {
    $sql = "
    CREATE TABLE IF NOT EXISTS `users` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `name` varchar(100) NOT NULL,
        `email` varchar(100) NOT NULL UNIQUE,
        `password` varchar(255) NOT NULL,
        `role` enum('admin','manager','staff') DEFAULT 'admin',
        `is_active` tinyint(1) DEFAULT 1,
        `last_login` datetime NULL,
        `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
        `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    
    CREATE TABLE IF NOT EXISTS `products` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `name` varchar(255) NOT NULL,
        `description` text,
        `price` decimal(10,2) NOT NULL,
        `compare_price` decimal(10,2) NULL,
        `cost_per_item` decimal(10,2) NULL,
        `sku` varchar(100) UNIQUE,
        `barcode` varchar(100),
        `inventory_quantity` int(11) DEFAULT 0,
        `inventory_policy` enum('deny','continue') DEFAULT 'deny',
        `inventory_tracking` enum('shopify','not_tracked') DEFAULT 'shopify',
        `weight` decimal(8,2) NULL,
        `weight_unit` enum('kg','g','lb','oz') DEFAULT 'kg',
        `status` enum('active','draft','archived') DEFAULT 'draft',
        `vendor` varchar(100),
        `product_type` varchar(100),
        `tags` text,
        `images` text,
        `seo_title` varchar(255),
        `seo_description` text,
        `is_gift_card` tinyint(1) DEFAULT 0,
        `requires_shipping` tinyint(1) DEFAULT 1,
        `taxable` tinyint(1) DEFAULT 1,
        `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
        `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        KEY `idx_status` (`status`),
        KEY `idx_product_type` (`product_type`),
        KEY `idx_vendor` (`vendor`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    
    CREATE TABLE IF NOT EXISTS `orders` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `order_number` varchar(50) NOT NULL UNIQUE,
        `customer_id` int(11) NULL,
        `customer_email` varchar(100) NOT NULL,
        `customer_name` varchar(100) NOT NULL,
        `total_price` decimal(10,2) NOT NULL,
        `subtotal_price` decimal(10,2) NOT NULL,
        `total_tax` decimal(10,2) DEFAULT 0,
        `total_discounts` decimal(10,2) DEFAULT 0,
        `currency` varchar(3) DEFAULT 'CLP',
        `financial_status` enum('paid','pending','unpaid','refunded') DEFAULT 'pending',
        `fulfillment_status` enum('fulfilled','partial','unfulfilled') DEFAULT 'unfulfilled',
        `shipping_address` text,
        `billing_address` text,
        `shipping_method` varchar(100),
        `tracking_number` varchar(100),
        `notes` text,
        `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
        `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        KEY `idx_order_number` (`order_number`),
        KEY `idx_customer_email` (`customer_email`),
        KEY `idx_financial_status` (`financial_status`),
        KEY `idx_fulfillment_status` (`fulfillment_status`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    
    CREATE TABLE IF NOT EXISTS `customers` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `first_name` varchar(100) NOT NULL,
        `first_name` varchar(100) NOT NULL,
        `email` varchar(100) NOT NULL UNIQUE,
        `phone` varchar(20),
        `company` varchar(100),
        `address` text,
        `city` varchar(100),
        `state` varchar(100),
        `country` varchar(100) DEFAULT 'Chile',
        `postal_code` varchar(20),
        `email_subscription` tinyint(1) DEFAULT 1,
        `total_spent` decimal(10,2) DEFAULT 0,
        `orders_count` int(11) DEFAULT 0,
        `last_order_date` datetime NULL,
        `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
        `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        KEY `idx_email` (`email`),
        KEY `idx_email_subscription` (`email_subscription`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    
    CREATE TABLE IF NOT EXISTS `collections` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `title` varchar(255) NOT NULL,
        `description` text,
        `handle` varchar(255) NOT NULL UNIQUE,
        `image` varchar(255),
        `status` enum('active','draft','archived') DEFAULT 'draft',
        `sort_order` enum('manual','best-selling','title-ascending','title-descending','price-ascending','price-descending','created-ascending','created-descending') DEFAULT 'manual',
        `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
        `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        KEY `idx_status` (`status`),
        KEY `idx_handle` (`handle`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    
    $pdo->exec($sql);
}

/**
 * Crear usuario administrador
 */
function createAdminUser($pdo, $data) {
    $hashedPassword = password_hash($data['admin_password'], PASSWORD_DEFAULT);
    
    $sql = "INSERT INTO users (name, email, password, role, is_active) VALUES (?, ?, ?, 'admin', 1)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$data['admin_name'], $data['admin_email'], $hashedPassword]);
}

/**
 * Crear archivo de configuración
 */
function createConfigFile($data) {
    $configContent = "<?php
/**
 * Configuración principal de la aplicación
 */

// Configuración de la base de datos
define('DB_HOST', '{$data['db_host']}');
define('DB_NAME', '{$data['db_name']}');
define('DB_USER', '{$data['db_user']}');
define('DB_PASS', '{$data['db_pass']}');
define('DB_CHARSET', 'utf8mb4');

// Configuración de la aplicación
define('APP_NAME', 'Verano Ecommerce');
define('APP_VERSION', '1.0.0');
define('APP_URL', '{$data['app_url']}');
define('ADMIN_URL', APP_URL . '/admin');

// Configuración de seguridad
define('JWT_SECRET', '{$data['jwt_secret']}');
define('SESSION_LIFETIME', 3600);
define('PASSWORD_COST', 12);

// Configuración de archivos
define('UPLOAD_DIR', __DIR__ . '/../uploads/');
define('MAX_FILE_SIZE', 5 * 1024 * 1024);
define('ALLOWED_EXTENSIONS', ['jpg', 'jpeg', 'png', 'gif', 'webp']);

// Configuración de paginación
define('ITEMS_PER_PAGE', 20);

// Configuración de zona horaria
date_default_timezone_set('America/Santiago');

// Configuración de sesión
ini_set('session.gc_maxlifetime', SESSION_LIFETIME);
ini_set('session.cookie_lifetime', SESSION_LIFETIME);

// Configuración de errores
if (getenv('APP_ENV') === 'production') {
    error_reporting(0);
    ini_set('display_errors', 0);
} else {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
}
";
    
    // Crear directorio config si no existe
    if (!is_dir('config')) {
        mkdir('config', 0755, true);
    }
    
    file_put_contents('config/config.php', $configContent);
}

/**
 * Crear archivo .env
 */
function createEnvFile($data) {
    $envContent = "APP_ENV=production
APP_URL={$data['app_url']}
DB_HOST={$data['db_host']}
DB_NAME={$data['db_name']}
DB_USER={$data['db_user']}
DB_PASS={$data['db_pass']}
JWT_SECRET={$data['jwt_secret']}
";
    
    file_put_contents('.env', $envContent);
}

/**
 * Generar string aleatorio
 */
function generateRandomString($length = 32) {
    $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $string = '';
    for ($i = 0; $i < $length; $i++) {
        $string .= $characters[rand(0, strlen($characters) - 1)];
    }
    return $string;
}
?>
