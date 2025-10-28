import axios from 'axios';

const API_KEY = process.env.PHISHTANK_API_KEY;
// Note: PhishTank's public API endpoint uses HTTP.
const API_URL = 'http://checkurl.phishtank.com/checkurl/';

export interface PhishTankResult {
  isKnownPhish: boolean;
  error?: string;
}

/**
 * Checks a given URL against the PhishTank database of known phishing sites.
 * @param url The URL to check.
 * @returns A promise that resolves to a PhishTankResult object.
 */
export async function checkPhishTank(url: string): Promise<PhishTankResult> {
  if (!API_KEY) {
    console.warn('PhishTank API key is not set. Skipping check.');
    return { isKnownPhish: false, error: 'API key not configured.' };
  }

  try {
    // The PhishTank API expects a POST request with form-urlencoded data.
    const params = new URLSearchParams();
    params.append('url', url);
    params.append('format', 'json');
    params.append('app_key', API_KEY);

    const response = await axios.post(API_URL, params, {
      headers: {
        // This header is important for the PhishTank API.
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (response.data && response.data.results) {
      return {
        isKnownPhish: response.data.results.in_database,
      };
    }

    // If the response format is unexpected, we assume it's not a known phish.
    return { isKnownPhish: false };

  } catch (error) {
    if (axios.isAxiosError(error)) {
        console.error('Error calling PhishTank API:', error.response?.data || error.message);
    } else {
        console.error('An unexpected error occurred during PhishTank check:', error);
    }
    // Default to a non-malicious result in case of an API error.
    return { isKnownPhish: false, error: 'API call failed.' };
  }
}
