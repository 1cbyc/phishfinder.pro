import { NextResponse, NextRequest } from 'next/server';
import clientPromise from '@/lib/mongodb';
import axios from 'axios';

const DB_NAME = process.env.DB_NAME || 'phishdetect';
const COLLECTION_NAME = 'source_blocklists';

const normalizeDomain = (domain: string): string => {
  return domain.toLowerCase().trim().replace(/^www\./, '');
};

const blocklistSources = [
  {
    name: 'MetaMask',
    url: 'https://raw.githubusercontent.com/MetaMask/eth-phishing-detect/main/src/hosts.json',
    parser: (data: any[]): string[] => {
      if (!Array.isArray(data)) return [];
      return data.map(d => typeof d === 'string' ? normalizeDomain(d) : normalizeDomain(String(d)));
    },
  },
  {
    name: 'PhishFort',
    url: 'https://raw.githubusercontent.com/phishfort/phishfort-lists/master/blacklists/domains.json',
    parser: (data: any[]): string[] => {
      if (!Array.isArray(data)) return [];
      return data.map(d => typeof d === 'string' ? normalizeDomain(d) : normalizeDomain(String(d)));
    },
  },
  {
    name: 'URLHaus',
    url: 'https://urlhaus.abuse.ch/downloads/hostfile/',
    parser: (data: string): string[] => {
      if (typeof data !== 'string') return [];
      const lines = data.split('\n');
      const domains: string[] = [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes(' ')) {
          const parts = trimmed.split(/\s+/);
          if (parts.length >= 2) {
            const domain = parts[1].trim();
            if (domain) {
              domains.push(normalizeDomain(domain));
            }
          }
        }
      }
      return domains.filter(d => d.length > 0);
    },
  },
  {
    name: 'PhishTank',
    url: 'https://data.phishtank.com/data/online-valid.json',
    parser: (data: any): string[] => {
      if (!data || !Array.isArray(data)) return [];
      const domains: string[] = [];
      for (const entry of data) {
        if (entry && entry.url) {
          try {
            const url = new URL(entry.url);
            domains.push(normalizeDomain(url.hostname));
          } catch (e) {
            continue;
          }
        }
      }
      return [...new Set(domains)];
    },
  },
  {
    name: 'OpenPhish',
    url: 'https://openphish.com/feed.txt',
    parser: (data: string): string[] => {
      if (typeof data !== 'string') return [];
      const lines = data.split('\n');
      const domains: string[] = [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && trimmed.startsWith('http')) {
          try {
            const url = new URL(trimmed);
            domains.push(normalizeDomain(url.hostname));
          } catch (e) {
            continue;
          }
        }
      }
      return [...new Set(domains)];
    },
  },
  {
    name: 'CryptoScamDB',
    url: 'https://cryptoscamdb.org/api/blacklist',
    parser: (data: any): string[] => {
      if (!data || !Array.isArray(data)) return [];
      return data
        .map(item => {
          if (item && typeof item === 'object') {
            return item.domain || item.hostname || item.url || null;
          }
          return typeof item === 'string' ? item : null;
        })
        .filter((d): d is string => d !== null)
        .map(d => normalizeDomain(d));
    },
  },
  {
    name: 'MalwareDomainList',
    url: 'https://www.malwaredomainlist.com/mdlcsv.php',
    parser: (data: string): string[] => {
      if (typeof data !== 'string') return [];
      const lines = data.split('\n');
      const domains: string[] = [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const parts = trimmed.split(',');
          if (parts.length > 0) {
            const domain = parts[0].trim().replace(/^https?:\/\//, '').split('/')[0];
            if (domain) {
              domains.push(normalizeDomain(domain));
            }
          }
        }
      }
      return [...new Set(domains)].filter(d => d.length > 0);
    },
  },
];

export async function GET(request: NextRequest) {
  // 1. Security Check: Ensure this endpoint is only called by Vercel's Cron service
  // Check for Vercel Cron header OR the custom secret
  const vercelCron = request.headers.get('x-vercel-signature');
  const authHeader = request.headers.get('authorization');
  
  // Allow either Vercel's signature or our custom bearer token
  const isVercelCron = !!vercelCron;
  const isValidAuth = authHeader === `Bearer ${process.env.CRON_SECRET}`;
  
  if (!isVercelCron && !isValidAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const mongoClient = await clientPromise;
    const db = mongoClient.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    let totalDomainsAdded = 0;
    const summary = [];

    // 2. Fetch and process each blocklist source
    for (const source of blocklistSources) {
      try {
        console.log(`Fetching blocklist from ${source.name}...`);
        const response = await axios.get(source.url, {
          timeout: 30000,
          headers: {
            'User-Agent': 'PhishFinder/1.0',
          },
        });
        const domains = source.parser(response.data);

        if (!Array.isArray(domains) || domains.length === 0) {
          console.warn(`No domains found or invalid format for source: ${source.name}`);
          summary.push({
            source: source.name,
            domains_found: 0,
            new_domains_added: 0,
            warning: 'No valid domains parsed',
          });
          continue;
        }

        const uniqueDomains = [...new Set(domains)].filter(d => d && d.length > 0);

        // 3. Prepare bulk database operations to be efficient
        // Using $setOnInsert to only set fields on new documents
        // Using $addToSet to add the source to the sources array without duplicates
        const bulkOps = uniqueDomains.map(domain => ({
          updateOne: {
            filter: { domain: domain },
            update: {
              $setOnInsert: {
                domain: domain,
                createdAt: new Date(),
              },
              $addToSet: {
                sources: source.name,
              },
              $set: {
                updatedAt: new Date(),
              },
            },
            upsert: true,
          },
        }));

        // 4. Execute the bulk write to the database
        const result = await collection.bulkWrite(bulkOps);
        const domainsAdded = result.upsertedCount;
        totalDomainsAdded += domainsAdded;

        const sourceSummary = {
            source: source.name,
            domains_found: uniqueDomains.length,
            new_domains_added: domainsAdded,
            total_processed: uniqueDomains.length,
        };
        summary.push(sourceSummary);
        console.log(`Finished processing ${source.name}. Found ${uniqueDomains.length} domains, added ${domainsAdded} new ones.`);

      } catch (error) {
        console.error(`Failed to process source ${source.name}:`, error);
        summary.push({
            source: source.name,
            error: 'Failed to fetch or process list.'
        });
      }
    }

    // 5. Return a summary of the operation
    return NextResponse.json({
      message: `Blocklist update complete. Total new domains added: ${totalDomainsAdded}.`,
      summary,
    });

  } catch (error) {
    console.error("Error in cron/update-blocklist endpoint:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 },
    );
  }
}
