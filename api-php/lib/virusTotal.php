<?php
/**
 * VirusTotal API Integration
 * 
 * Note: This uses the v2 API. Consider upgrading to v3 for better performance.
 */

function checkVirusTotal(string $url): ?array {
    $apiKey = VIRUSTOTAL_API_KEY;
    
    if (empty($apiKey)) {
        error_log('VirusTotal API key not configured');
        return null;
    }
    
    $apiUrl = 'https://www.virustotal.com/vtapi/v2/url/report';
    
    $postData = http_build_query([
        'apikey' => $apiKey,
        'resource' => $url
    ]);
    
    $ch = curl_init($apiUrl);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $postData,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_CONNECTTIMEOUT => 5
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error || $httpCode !== 200) {
        error_log('VirusTotal error: ' . ($error ?: "HTTP $httpCode"));
        return null;
    }
    
    $data = json_decode($response, true);
    
    if (isset($data['response_code']) && $data['response_code'] === 1) {
        return [
            'isMalicious' => ($data['positives'] ?? 0) > 5,
            'positives' => $data['positives'] ?? 0,
            'total' => $data['total'] ?? 0,
            'scanDate' => $data['scan_date'] ?? null
        ];
    }
    
    return null;
}
?>

