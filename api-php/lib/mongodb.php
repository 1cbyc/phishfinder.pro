<?php
/**
 * MongoDB Connection Handler for PHP
 * 
 * Requires: MongoDB PHP Library (composer require mongodb/mongodb)
 * 
 * For cPanel: You may need to install MongoDB extension via PECL or use MongoDB Atlas (cloud)
 */

require_once __DIR__ . '/../vendor/autoload.php';

use MongoDB\Client;
use MongoDB\Database;

class MongoDBConnection {
    private static $client = null;
    private static $database = null;
    
    /**
     * Get MongoDB client instance
     */
    public static function getClient(): Client {
        if (self::$client === null) {
            $uri = MONGODB_URI;
            if (empty($uri)) {
                throw new Exception('MongoDB URI not configured. Please set MONGODB_URI in config.php');
            }
            
            self::$client = new Client($uri);
        }
        
        return self::$client;
    }
    
    /**
     * Get database instance
     */
    public static function getDatabase(): Database {
        if (self::$database === null) {
            $client = self::getClient();
            self::$database = $client->selectDatabase(DB_NAME);
        }
        
        return self::$database;
    }
    
    /**
     * Get a collection
     */
    public static function getCollection(string $collectionName) {
        $db = self::getDatabase();
        return $db->selectCollection($collectionName);
    }
}
?>

