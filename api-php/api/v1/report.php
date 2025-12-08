<?php
/**
 * Report Phishing URL Endpoint
 * POST /api/v1/report.php
 * 
 * Request: { "url": "https://example.com" }
 * Response: { "message": "URL reported successfully..." }
 */

require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../../lib/mongodb.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed. Use POST.']);
    exit();
}

try {
    // Get request body
    $input = file_get_contents('php://input');
    $body = json_decode($input, true);
    
    // Validate input
    if (!isset($body['url']) || !is_string($body['url'])) {
        http_response_code(400);
        echo json_encode(['error' => 'URL is required and must be a string.']);
        exit();
    }
    
    $url = $body['url'];
    
    // Simple URL validation
    $urlPattern = '/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/';
    if (!preg_match($urlPattern, $url)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid URL format.']);
        exit();
    }
    
    // Connect to database
    $collection = MongoDBConnection::getCollection(SUBMISSIONS_COLLECTION);
    
    // Insert or update the submitted URL
    $collection->updateOne(
        ['url' => $url],
        [
            '$set' => ['updatedAt' => new MongoDB\BSON\UTCDateTime()],
            '$setOnInsert' => [
                'url' => $url,
                'createdAt' => new MongoDB\BSON\UTCDateTime()
            ]
        ],
        ['upsert' => true]
    );
    
    error_log("URL reported and added/updated in submissions: $url");
    
    // Return success response
    http_response_code(200);
    echo json_encode([
        'message' => 'URL reported successfully. Thank you for improving the community\'s safety!'
    ]);
    
} catch (Exception $e) {
    error_log("Error in report endpoint: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'An internal server error occurred.']);
}
?>

