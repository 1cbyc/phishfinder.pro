<?php
// Configuration (use env vars; never commit real secrets)

// Database Configuration (MongoDB)
// Note: Some cPanel hosts support MongoDB, but MySQL is more common
// If your cPanel doesn't support MongoDB, you'll need to use MongoDB Atlas (cloud) or switch to MySQL
define('MONGODB_URI', getenv('MONGODB_URI') ?: '');
define('DB_NAME', getenv('DB_NAME') ?: 'phishdetect');

// External API Keys
define('GOOGLE_SAFE_BROWSING_API_KEY', getenv('GOOGLE_SAFE_BROWSING_API_KEY') ?: '');
define('VIRUSTOTAL_API_KEY', getenv('VIRUSTOTAL_API_KEY') ?: '');
define('PHISHTANK_API_KEY', getenv('PHISHTANK_API_KEY') ?: '');

// Cache Duration (24 hours in seconds)
define('CACHE_DURATION_SECONDS', 24 * 60 * 60);

// Collections
define('CACHE_COLLECTION', 'url_analysis_cache');
define('SUBMISSIONS_COLLECTION', 'user_submissions');
define('BLOCKLIST_COLLECTION', 'source_blocklists');

// Error Reporting (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 0); // Set to 1 for debugging

// Set JSON header
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Adjust for production
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
?>

