import axios from 'axios';

export async function checkPhishTank(url: string) {
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
