<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../lib/mongodb.php';

try {
    $health = [
        'status' => 'healthy',
        'timestamp' => date('c'),
        'checks' => []
    ];
    
    // Check environment variables
    $missingEnvVars = [];
    $envStatus = [];
    
    $requiredVars = [
        'GOOGLE_SAFE_BROWSING_API_KEY',
        'VIRUSTOTAL_API_KEY',
        'MONGODB_URI',
        'DB_NAME'
    ];
    
    foreach ($requiredVars as $var) {
        $isPresent = defined($var) && !empty(constant($var));
        $envStatus[$var] = $isPresent;
        if (!$isPresent) {
            $missingEnvVars[] = $var;
        }
    }
    
    $health['checks']['environment'] = [
        'status' => count($missingEnvVars) === 0 ? 'ok' : 'missing_vars',
        'missing' => $missingEnvVars,
        'details' => $envStatus
    ];
    
    // Check database connectivity
    $dbStatus = 'connected';
    $blocklistCount = 0;
    $submissionsCount = 0;
    $dbError = null;
    
    try {
        $db = MongoDBConnection::getDatabase();
        $admin = $db->getManager();
        
        // Count documents
        $blocklistCollection = MongoDBConnection::getCollection(BLOCKLIST_COLLECTION);
        $submissionsCollection = MongoDBConnection::getCollection(SUBMISSIONS_COLLECTION);
        
        $blocklistCount = $blocklistCollection->countDocuments();
        $submissionsCount = $submissionsCollection->countDocuments();
    } catch (Exception $e) {
        $dbStatus = 'disconnected';
        $dbError = $e->getMessage();
    }
    
    $health['checks']['database'] = [
        'status' => $dbStatus,
        'error' => $dbError
    ];
    
    $health['checks']['intelligence'] = [
        'blocklist_domains' => $blocklistCount,
        'user_submissions' => $submissionsCount,
        'total_indicators' => $blocklistCount + $submissionsCount
    ];
    
    // Determine overall health
    $isHealthy = $dbStatus === 'connected' && count($missingEnvVars) === 0;
    $health['status'] = $isHealthy ? 'healthy' : 'unhealthy';
    
    http_response_code($isHealthy ? 200 : 500);
    echo json_encode($health, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'timestamp' => date('c'),
        'error' => $e->getMessage()
    ]);
}
?>

