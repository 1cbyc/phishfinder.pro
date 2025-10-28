import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface AnalysisReport {
  googleSafeBrowsing?: {
    isMalicious: boolean;
    threatTypes?: string[];
  };
  virusTotal?: {
    positives: number;
    total: number;
    scanDate?: string;
  };
  phishTank?: {
    isKnownPhish: boolean;
    verified?: boolean;
  };
}

interface CachedResult {
  id: number;
  url: string;
  final_verdict: string;
  full_report: AnalysisReport;
  last_scanned_at: string;
  created_at: string;
}

// Helper function to validate URL
function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

// Check cache in Supabase
async function checkCache(url: string): Promise<CachedResult | null> {
  try {
    const { data, error } = await supabase
      .from('url_analysis_cache')
      .select('*')
      .eq('url', url)
      .single();

    if (error || !data) return null;
    return data as CachedResult;
  } catch (error) {
    console.error('Error checking cache:', error);
    return null;
  }
}

// Save to cache
async function saveToCache(url: string, verdict: string, report: AnalysisReport): Promise<void> {
  try {
    const { error } = await supabase
      .from('url_analysis_cache')
      .upsert({
        url,
        final_verdict: verdict,
        full_report: report,
        last_scanned_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error saving to cache:', error);
    }
  } catch (error) {
    console.error('Error saving to cache:', error);
  }
}

// Check Google Safe Browsing
async function checkGoogleSafeBrowsing(url: string): Promise<any> {
  try {
    const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
    if (!apiKey) {
      console.warn('Google Safe Browsing API key not configured');
      return null;
    }

    const response = await axios.post(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
      {
        client: {
          clientId: 'phish-detect',
          clientVersion: '1.0',
        },
        threatInfo: {
          threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE'],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [{ url }],
        },
      },
      {
        timeout: 5000,
      }
    );

    const matches = response.data.matches || [];
    return {
      isMalicious: matches.length > 0,
      threatTypes: matches.map((m: any) => m.threatType),
    };
  } catch (error: any) {
    console.error('Google Safe Browsing error:', error.message);
    return null;
  }
}

// Check VirusTotal
async function checkVirusTotal(url: string): Promise<any> {
  try {
    const apiKey = process.env.VIRUSTOTAL_API_KEY;
    if (!apiKey) {
      console.warn('VirusTotal API key not configured');
      return null;
    }

    // First, submit URL for scanning
    const submitResponse = await axios.post(
      'https://www.virustotal.com/vtapi/v2/url/scan',
      new URLSearchParams({
        apikey: apiKey,
        url: url,
      }),
      {
        timeout: 5000,
      }
    );

    // Then get the report
    const reportResponse = await axios.post(
      'https://www.virustotal.com/vtapi/v2/url/report',
      new URLSearchParams({
        apikey: apiKey,
        resource: url,
      }),
      {
        timeout: 5000,
      }
    );

    const data = reportResponse.data;
    if (data.response_code === 1) {
      return {
        positives: data.positives || 0,
        total: data.total || 0,
        scanDate: data.scan_date,
      };
    }
    return null;
  } catch (error: any) {
    console.error('VirusTotal error:', error.message);
    return null;
  }
}

// Check PhishTank
async function checkPhishTank(url: string): Promise<any> {
  try {
    const apiKey = process.env.PHISHTANK_API_KEY;
    if (!apiKey) {
      console.warn('PhishTank API key not configured');
      return null;
    }

    const response = await axios.post(
      'http://checkurl.phishtank.com/checkurl/',
      new URLSearchParams({
        format: 'json',
        app_key: apiKey,
        url: url,
      }),
      {
        timeout: 5000,
      }
    );

    const results = response.data.results;
    if (results) {
      return {
        isKnownPhish: results.in_database === true,
        verified: results.verified === true,
      };
    }
    return null;
  } catch (error: any) {
    console.error('PhishTank error:', error.message);
    return null;
  }
}

// Determine final verdict based on all sources
function determineVerdict(report: AnalysisReport): { verdict: string; score: number } {
  let maliciousCount = 0;
  let suspiciousCount = 0;
  let safeCount = 0;

  // Google Safe Browsing
  if (report.googleSafeBrowsing?.isMalicious) {
    maliciousCount += 2;
  } else if (report.googleSafeBrowsing) {
    safeCount++;
  }

  // VirusTotal
  if (report.virusTotal) {
    const positiveRate = report.virusTotal.positives / report.virusTotal.total;
    if (positiveRate > 0.3) {
      maliciousCount += 2;
    } else if (positiveRate > 0.1) {
      suspiciousCount++;
    } else {
      safeCount++;
    }
  }

  // PhishTank
  if (report.phishTank?.isKnownPhish && report.phishTank.verified) {
    maliciousCount += 2;
  } else if (report.phishTank?.isKnownPhish) {
    suspiciousCount++;
  } else if (report.phishTank) {
    safeCount++;
  }

  // Calculate score (0-100)
  const totalChecks = (report.googleSafeBrowsing ? 1 : 0) + 
                      (report.virusTotal ? 1 : 0) + 
                      (report.phishTank ? 1 : 0);
  
  const confidenceScore = totalChecks > 0 
    ? Math.round(((safeCount / totalChecks) * 100)) 
    : 0;

  // Determine verdict
  let verdict = 'Safe';
  if (maliciousCount >= 3) {
    verdict = 'Malicious';
  } else if (maliciousCount > 0 || suspiciousCount > 0) {
    verdict = 'Suspicious';
  }

  return { verdict, score: confidenceScore };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    // Validate input
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    if (!isValidUrl(url)) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Check cache first
    const cached = await checkCache(url);
    if (cached) {
      return NextResponse.json({
        url: cached.url,
        verdict: cached.final_verdict,
        confidenceScore: 50, // Default for cached results
        scannedAt: cached.last_scanned_at,
        source: 'cache',
        report: cached.full_report,
      });
    }

    // Run live checks
    const report: AnalysisReport = {};
    
    // Run all checks in parallel with timeout
    const [googleResult, virusTotalResult, phishTankResult] = await Promise.allSettled([
      checkGoogleSafeBrowsing(url),
      checkVirusTotal(url),
      checkPhishTank(url),
    ]);

    if (googleResult.status === 'fulfilled' && googleResult.value) {
      report.googleSafeBrowsing = googleResult.value;
    }

    if (virusTotalResult.status === 'fulfilled' && virusTotalResult.value) {
      report.virusTotal = virusTotalResult.value;
    }

    if (phishTankResult.status === 'fulfilled' && phishTankResult.value) {
      report.phishTank = phishTankResult.value;
    }

    // If no external services returned results, return error
    if (Object.keys(report).length === 0) {
      return NextResponse.json(
        { error: 'Unable to analyze URL: no external services available' },
        { status: 503 }
      );
    }

    // Determine final verdict
    const { verdict, score } = determineVerdict(report);

    // Save to cache
    await saveToCache(url, verdict, report);

    return NextResponse.json({
      url,
      verdict,
      confidenceScore: score,
      scannedAt: new Date().toISOString(),
      source: 'live',
      report,
    });
  } catch (error: any) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

