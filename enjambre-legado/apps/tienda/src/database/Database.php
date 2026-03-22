<?php
namespace Verano\Database;

use PDO;
use PDOException;

/**
 * Clase para manejo de base de datos MySQL
 */
class Database
{
    private static $instance = null;
    private $connection;
    
    private function __construct()
    {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            
            $this->connection = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . DB_CHARSET
            ]);
            
        } catch (PDOException $e) {
            die("Error de conexión: " . $e->getMessage());
        }
    }
    
    /**
     * Obtener instancia única (Singleton)
     */
    public static function getInstance()
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Obtener conexión PDO
     */
    public function getConnection()
    {
        return $this->connection;
    }
    
    /**
     * Ejecutar consulta SELECT
     */
    public function select($sql, $params = [])
    {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Error en SELECT: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Ejecutar consulta SELECT y obtener una sola fila
     */
    public function selectOne($sql, $params = [])
    {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetch();
        } catch (PDOException $e) {
            error_log("Error en SELECT ONE: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Ejecutar consulta INSERT
     */
    public function insert($sql, $params = [])
    {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $this->connection->lastInsertId();
        } catch (PDOException $e) {
            error_log("Error en INSERT: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Ejecutar consulta UPDATE
     */
    public function update($sql, $params = [])
    {
        try {
            $stmt = $this->connection->prepare($sql);
            return $stmt->execute($params);
        } catch (PDOException $e) {
            error_log("Error en UPDATE: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Ejecutar consulta DELETE
     */
    public function delete($sql, $params = [])
    {
        try {
            $stmt = $this->connection->prepare($sql);
            return $stmt->execute($params);
        } catch (PDOException $e) {
            error_log("Error en DELETE: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Ejecutar consulta personalizada
     */
    public function execute($sql, $params = [])
    {
        try {
            $stmt = $this->connection->prepare($sql);
            return $stmt->execute($params);
        } catch (PDOException $e) {
            error_log("Error en EXECUTE: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Iniciar transacción
     */
    public function beginTransaction()
    {
        return $this->connection->beginTransaction();
    }
    
    /**
     * Confirmar transacción
     */
    public function commit()
    {
        return $this->connection->commit();
    }
    
    /**
     * Revertir transacción
     */
    public function rollback()
    {
        return $this->connection->rollback();
    }
    
    /**
     * Verificar si hay transacción activa
     */
    public function inTransaction()
    {
        return $this->connection->inTransaction();
    }
    
    /**
     * Obtener número de filas afectadas
     */
    public function rowCount($sql, $params = [])
    {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt->rowCount();
        } catch (PDOException $e) {
            error_log("Error en ROW COUNT: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Escapar string para prevenir SQL injection
     */
    public function escape($string)
    {
        return $this->connection->quote($string);
    }
    
    /**
     * Cerrar conexión
     */
    public function close()
    {
        $this->connection = null;
        self::$instance = null;
    }
    
    /**
     * Prevenir clonación
     */
    private function __clone() {}
    
    /**
     * Prevenir deserialización
     */
    private function __wakeup() {}
}
