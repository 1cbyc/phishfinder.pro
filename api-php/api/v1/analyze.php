<?php
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../../lib/mongodb.php';
require_once __DIR__ . '/../../lib/googleSafeBrowsing.php';
require_once __DIR__ . '/../../lib/virusTotal.php';

function getDomain(string $url): ?string {
    try {
        $parsed = parse_url($url);
        if (!isset($parsed['host'])) {
            return null;
        }
        
        $hostname = $parsed['host'];
        // Remove "www." prefix
        if (strpos($hostname, 'www.') === 0) {
            $hostname = substr($hostname, 4);
        }
        
        return $hostname;
    } catch (Exception $e) {
        error_log("Could not parse domain from URL: $url - " . $e->getMessage());
        return null;
    }
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed. Use POST.']);
    exit();
}

try {
    // Get request body
    $input = file_get_contents('php://input');
    $body = json_decode($input, true);
    
    if (!isset($body['url']) || !is_string($body['url'])) {
        http_response_code(400);
        echo json_encode(['error' => 'URL is required and must be a string.']);
        exit();
    }
    
    $url = $body['url'];
    
    // Ensure URL has a protocol
    if (!preg_match('/^https?:\/\//', $url)) {
        $url = 'http://' . $url;
    }
    
    $db = MongoDBConnection::getDatabase();
    
    // --- 1. Check Internal Intelligence First ---
    
    // Check #1: User-submitted malicious URLs
    $submissionsCollection = MongoDBConnection::getCollection(SUBMISSIONS_COLLECTION);
    $userSubmission = $submissionsCollection->findOne(['url' => $url]);
    
    if ($userSubmission) {
        error_log("Malicious URL identified from user submissions: $url");
        echo json_encode([
            'url' => $url,
            'verdict' => 'Malicious',
            'source' => 'User Submission',
            'scannedAt' => date('c'),
            'report' => [
                'internalBlock' => ['isMalicious' => true, 'source' => 'User Submission']
            ]
        ]);
        exit();
    }
    
    // Check #2: Curated source blocklists (by domain)
    $domain = getDomain($url);
    if ($domain) {
        $blocklistCollection = MongoDBConnection::getCollection(BLOCKLIST_COLLECTION);
        $blockedDomain = $blocklistCollection->findOne(['domain' => $domain]);
        
        if ($blockedDomain) {
            $sources = isset($blockedDomain['sources']) && is_array($blockedDomain['sources'])
                ? $blockedDomain['sources']
                : [($blockedDomain['source'] ?? 'Unknown')];
            
            error_log("Malicious domain identified from source blocklist: $domain");
            echo json_encode([
                'url' => $url,
                'verdict' => 'Malicious',
                'source' => 'Blocklist (' . implode(', ', $sources) . ')',
                'scannedAt' => date('c'),
                'report' => [
                    'internalBlock' => [
                        'isMalicious' => true,
                        'source' => 'Blocklist (' . implode(', ', $sources) . ')'
                    ]
                ]
            ]);
            exit();
        }
    }
    
    // --- 2. Check for a fresh, cached result ---
    $cacheCollection = MongoDBConnection::getCollection(CACHE_COLLECTION);
    $cachedData = $cacheCollection->findOne(['url' => $url]);
    
    if ($cachedData) {
        $lastScanned = $cachedData['last_scanned_at']->toDateTime();
        $now = new DateTime();
        $diff = $now->getTimestamp() - $lastScanned->getTimestamp();
        
        if ($diff < CACHE_DURATION_SECONDS) {
            error_log("Returning fresh cached result for: $url");
            $report = $cachedData['full_report'];
            $report['source'] = 'cache';
            echo json_encode($report);
            exit();
        }
    }
    
    error_log("Performing live analysis for: $url");
    
    // --- 3. Perform Live Analysis (Cache Miss) ---
    $googleResult = checkGoogleSafeBrowsing($url);
    $virusTotalResult = checkVirusTotal($url);
    
    // --- 4. Aggregate Results for a Final Verdict ---
    $finalVerdict = 'Safe';
    if ($googleResult['isMalicious'] || ($virusTotalResult && $virusTotalResult['positives'] > 5)) {
        $finalVerdict = 'Malicious';
    } elseif ($virusTotalResult && $virusTotalResult['positives'] > 0) {
        $finalVerdict = 'Suspicious';
    }
    
    $report = [
        'googleSafeBrowsing' => $googleResult,
        'virusTotal' => $virusTotalResult
    ];
    
    $responsePayload = [
        'url' => $url,
        'verdict' => $finalVerdict,
        'source' => 'live',
        'scannedAt' => date('c'),
        'report' => $report
    ];
    
    // --- 5. Store the new result in the cache ---
    $cacheCollection->updateOne(
        ['url' => $url],
        [
            '$set' => [
                'full_report' => $responsePayload,
                'last_scanned_at' => new MongoDB\BSON\UTCDateTime()
            ]
        ],
        ['upsert' => true]
    );
    
    error_log("Successfully cached result for: $url");
    
    // --- 6. Return the live analysis result ---
    echo json_encode($responsePayload);
    
} catch (Exception $e) {
    error_log("Error in analyze endpoint: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'An internal server error occurred.']);
}
?>

