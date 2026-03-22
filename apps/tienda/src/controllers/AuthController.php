<?php
namespace Verano\Controllers;

use Verano\Database\Database;
use Verano\Models\User;

/**
 * Controlador de autenticación
 */
class AuthController
{
    private $db;
    
    public function __construct()
    {
        $this->db = Database::getInstance();
    }
    
    /**
     * Mostrar página de login
     */
    public function login()
    {
        // Si ya está logueado, redirigir al dashboard
        if (isset($_SESSION['user_id'])) {
            header('Location: /admin/');
            exit();
        }
        
        // Procesar formulario de login
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $this->processLogin();
        }
        
        // Mostrar vista de login
        $this->renderLoginView();
    }
    
    /**
     * Procesar login
     */
    private function processLogin()
    {
        $email = trim($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';
        
        // Validaciones básicas
        if (empty($email) || empty($password)) {
            $this->setError('Por favor completa todos los campos');
            return;
        }
        
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->setError('Email inválido');
            return;
        }
        
        // Buscar usuario en la base de datos
        $user = $this->db->selectOne(
            "SELECT * FROM users WHERE email = ? AND is_active = 1",
            [$email]
        );
        
        if (!$user) {
            $this->setError('Credenciales inválidas');
            return;
        }
        
        // Verificar contraseña
        if (!password_verify($password, $user['password'])) {
            $this->setError('Credenciales inválidas');
            return;
        }
        
        // Login exitoso
        $this->createSession($user);
        
        // Actualizar último login
        $this->db->update(
            "UPDATE users SET last_login = NOW() WHERE id = ?",
            [$user['id']]
        );
        
        // Redirigir al dashboard
        header('Location: /admin/');
        exit();
    }
    
    /**
     * Crear sesión de usuario
     */
    private function createSession($user)
    {
        // Regenerar ID de sesión por seguridad
        session_regenerate_id(true);
        
        // Guardar datos del usuario en sesión
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_email'] = $user['email'];
        $_SESSION['user_name'] = $user['name'];
        $_SESSION['user_role'] = $user['role'];
        $_SESSION['login_time'] = time();
        
        // Limpiar mensajes de error
        unset($_SESSION['error']);
    }
    
    /**
     * Cerrar sesión
     */
    public function logout()
    {
        // Destruir sesión
        session_destroy();
        
        // Redirigir al login
        header('Location: /admin/login');
        exit();
    }
    
    /**
     * Verificar si el usuario está autenticado
     */
    public static function isAuthenticated()
    {
        if (!isset($_SESSION['user_id'])) {
            return false;
        }
        
        // Verificar tiempo de sesión
        $sessionLifetime = SESSION_LIFETIME;
        if (time() - $_SESSION['login_time'] > $sessionLifetime) {
            session_destroy();
            return false;
        }
        
        // Actualizar tiempo de sesión
        $_SESSION['login_time'] = time();
        
        return true;
    }
    
    /**
     * Verificar si el usuario tiene rol específico
     */
    public static function hasRole($role)
    {
        if (!self::isAuthenticated()) {
            return false;
        }
        
        return $_SESSION['user_role'] === $role;
    }
    
    /**
     * Obtener usuario actual
     */
    public static function getCurrentUser()
    {
        if (!self::isAuthenticated()) {
            return null;
        }
        
        return [
            'id' => $_SESSION['user_id'],
            'email' => $_SESSION['user_email'],
            'name' => $_SESSION['user_name'],
            'role' => $_SESSION['user_role']
        ];
    }
    
    /**
     * Establecer mensaje de error
     */
    private function setError($message)
    {
        $_SESSION['error'] = $message;
    }
    
    /**
     * Renderizar vista de login
     */
    private function renderLoginView()
    {
        $error = $_SESSION['error'] ?? '';
        unset($_SESSION['error']);
        
        // Incluir vista
        include __DIR__ . '/../views/auth/login.php';
    }
    
    /**
     * Middleware para proteger rutas
     */
    public static function requireAuth()
    {
        if (!self::isAuthenticated()) {
            header('Location: /admin/login');
            exit();
        }
    }
    
    /**
     * Middleware para requerir rol específico
     */
    public static function requireRole($role)
    {
        self::requireAuth();
        
        if (!self::hasRole($role)) {
            http_response_code(403);
            include __DIR__ . '/../views/errors/403.php';
            exit();
        }
    }
}
