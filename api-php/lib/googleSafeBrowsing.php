<?php
/**
 * Google Safe Browsing API Integration
 */

function checkGoogleSafeBrowsing(string $url): array {
    $apiKey = GOOGLE_SAFE_BROWSING_API_KEY;
    
    if (empty($apiKey)) {
        error_log("Google Safe Browsing API key not configured");
        return ['isMalicious' => false, 'threatTypes' => []];
    }
    
    $apiUrl = "https://safebrowsing.googleapis.com/v4/threatMatches:find?key=" . urlencode($apiKey);
    
    $payload = [
        'client' => [
            'clientId' => 'phish-detect',
            'clientVersion' => '1.0'
        ],
        'threatInfo' => [
            'threatTypes' => ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE'],
            'platformTypes' => ['ANY_PLATFORM'],
            'threatEntryTypes' => ['URL'],
            'threatEntries' => [['url' => $url]]
        ]
    ];
    
    $ch = curl_init($apiUrl);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json'
        ],
        CURLOPT_TIMEOUT => 10,
        CURLOPT_CONNECTTIMEOUT => 5
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error || $httpCode !== 200) {
        error_log("Google Safe Browsing error: " . ($error ?: "HTTP $httpCode"));
        return ['isMalicious' => false, 'threatTypes' => []];
    }
    
    $data = json_decode($response, true);
    $matches = $data['matches'] ?? [];
    
    return [
        'isMalicious' => count($matches) > 0,
        'threatTypes' => array_column($matches, 'threatType')
    ];
}
?>

