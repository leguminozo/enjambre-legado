<?php
/**
 * Verano Ecommerce - Panel de Administración
 * Archivo principal de entrada
 */

// Configuración de errores (desactivar en producción)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Iniciar sesión
session_start();

// Cargar autoloader de Composer
require_once __DIR__ . '/../vendor/autoload.php';

// Cargar configuración
require_once __DIR__ . '/../config/config.php';

// Cargar funciones de utilidad
require_once __DIR__ . '/../src/helpers/functions.php';

// Cargar base de datos
require_once __DIR__ . '/../src/database/Database.php';

// Router simple
$request = $_SERVER['REQUEST_URI'];
$basePath = '/admin';

// Remover base path si existe
if (strpos($request, $basePath) === 0) {
    $request = substr($request, strlen($basePath));
}

// Remover query string
$request = strtok($request, '?');

// Router básico
switch ($request) {
    case '':
    case '/':
        require __DIR__ . '/../src/controllers/DashboardController.php';
        $controller = new \Verano\Controllers\DashboardController();
        $controller->index();
        break;
        
    case '/login':
        require __DIR__ . '/../src/controllers/AuthController.php';
        $controller = new \Verano\Controllers\AuthController();
        $controller->login();
        break;
        
    case '/logout':
        require __DIR__ . '/../src/controllers/AuthController.php';
        $controller = new \Verano\Controllers\AuthController();
        $controller->logout();
        break;
        
    case '/products':
        require __DIR__ . '/../src/controllers/ProductController.php';
        $controller = new \Verano\Controllers\ProductController();
        $controller->index();
        break;
        
    case '/orders':
        require __DIR__ . '/../src/controllers/OrderController.php';
        $controller = new \Verano\Controllers\OrderController();
        $controller->index();
        break;
        
    case '/customers':
        require __DIR__ . '/../src/controllers/CustomerController.php';
        $controller = new \Verano\Controllers\CustomerController();
        $controller->index();
        break;
        
    case '/collections':
        require __DIR__ . '/../src/controllers/CollectionController.php';
        $controller = new \Verano\Controllers\CollectionController();
        $controller->index();
        break;
        
    case '/api/products':
        require __DIR__ . '/../src/controllers/Api/ProductApiController.php';
        $controller = new \Verano\Controllers\Api\ProductApiController();
        $controller->handleRequest();
        break;
        
    case '/api/orders':
        require __DIR__ . '/../src/controllers/Api/OrderApiController.php';
        $controller = new \Verano\Controllers\Api\OrderApiController();
        $controller->handleRequest();
        break;
        
    case '/api/customers':
        require __DIR__ . '/../src/controllers/Api\CustomerApiController.php';
        $controller = new \Verano\Controllers\Api\CustomerApiController();
        $controller->handleRequest();
        break;
        
    case '/api/dashboard':
        require __DIR__ . '/../src/controllers/Api\DashboardApiController.php';
        $controller = new \Verano\Controllers\Api\DashboardApiController();
        $controller->handleRequest();
        break;
        
    default:
        // Página 404
        http_response_code(404);
        require __DIR__ . '/../src/views/404.php';
        break;
}
