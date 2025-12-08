# PhishDetect PHP API

PHP backend API for PhishDetect, designed to run on cPanel hosting.

## Requirements

- PHP 7.4 or higher
- cPanel hosting with:
  - MongoDB extension (via PECL) OR MongoDB Atlas (cloud) connection
  - Composer support (or install dependencies manually)
  - curl extension enabled
  - json extension enabled

## Installation on cPanel

### Option 1: Using MongoDB Atlas (Recommended - Easier Setup)

1. **Create MongoDB Atlas account** (free tier available)
   - Go to https://www.mongodb.com/cloud/atlas
   - Create a free cluster
   - Get your connection string

2. **Upload files to cPanel**
   - Upload the `api-php` folder to your cPanel public_html or a subdirectory
   - Example: `public_html/api-php/`

3. **Install dependencies**
   ```bash
   cd api-php
   composer install
   ```
   (If composer isn't available via SSH, download vendor folder separately)

4. **Configure environment**
   - Create a `.env` file or edit `config.php` directly
   - Set your MongoDB URI, API keys, etc.

5. **Set permissions**
   - Ensure PHP files are readable (644)
   - Ensure directories are executable (755)

### Option 2: Using Local MongoDB (If cPanel supports it)

1. Install MongoDB PHP extension via PECL in cPanel
2. Follow steps 2-5 from Option 1

## Configuration

Edit `config.php` or set environment variables:

```php
MONGODB_URI=your_mongodb_connection_string
DB_NAME=phishdetect
GOOGLE_SAFE_BROWSING_API_KEY=your_key
VIRUSTOTAL_API_KEY=your_key
PHISHTANK_API_KEY=your_key
```

## API Endpoints

### POST /api/v1/analyze.php
Analyze a URL for phishing/malware threats.

**Request:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "url": "https://example.com",
  "verdict": "Safe|Suspicious|Malicious",
  "source": "cache|live|User Submission|Blocklist",
  "scannedAt": "2023-10-27T10:00:00Z",
  "report": {
    "googleSafeBrowsing": {...},
    "virusTotal": {...}
  }
}
```

### POST /api/v1/report.php
Report a URL as phishing.

**Request:**
```json
{
  "url": "https://example.com"
}
```

## Frontend Integration

Update your Next.js frontend to point to the PHP API:

```typescript
// In app/page.tsx, change the fetch URL:
const response = await fetch("https://your-cpanel-domain.com/api-php/api/v1/analyze.php", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ url }),
});
```

## Troubleshooting

### MongoDB Connection Issues
- Verify MongoDB URI is correct
- Check if MongoDB extension is installed: `php -m | grep mongodb`
- For MongoDB Atlas, ensure your IP is whitelisted

### Composer Not Available
- Download the `vendor` folder separately and upload it
- Or use a local machine to run `composer install` and upload the vendor folder

### API Errors
- Check PHP error logs in cPanel
- Enable error display in `config.php` for debugging (disable in production)
- Verify all API keys are set correctly

## Security Notes

- Never commit `.env` files or `config.php` with real API keys
- Use HTTPS for all API calls
- Adjust CORS headers in `config.php` for production
- Consider rate limiting for production use

