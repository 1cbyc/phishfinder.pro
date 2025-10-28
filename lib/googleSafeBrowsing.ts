import axios from 'axios';

export async function checkGoogleSafeBrowsing(url: string) {
  try {
    const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
    if (!apiKey) {
      console.warn('Google Safe Browsing API key not configured');
      return { isMalicious: false, threatTypes: [] };
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
      threatTypes: matches.map((m: any) => m.threatType) || [],
    };
  } catch (error: any) {
    console.error('Google Safe Browsing error:', error.message);
    return { isMalicious: false, threatTypes: [] };
  }
}

