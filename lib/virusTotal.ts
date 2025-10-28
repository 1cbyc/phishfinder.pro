import axios from 'axios';

export async function checkVirusTotal(url: string) {
  try {
    const apiKey = process.env.VIRUSTOTAL_API_KEY;
    if (!apiKey) {
      console.warn('VirusTotal API key not configured');
      return null;
    }

    // Get the report
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
