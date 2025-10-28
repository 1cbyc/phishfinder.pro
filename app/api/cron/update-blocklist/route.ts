import { NextResponse, NextRequest } from 'next/server';
import clientPromise from '@/lib/mongodb';
import axios from 'axios';

const DB_NAME = process.env.DB_NAME || 'phishdetect';
const COLLECTION_NAME = 'source_blocklists';

// Define the sources for our blocklists.
// We can easily add more sources here in the future.
const blocklistSources = [
  {
    name: 'MetaMask',
    url: 'https://raw.githubusercontent.com/MetaMask/eth-phishing-detect/main/src/hosts.json',
    parser: (data: any[]): string[] => data, // The data is already an array of strings
  },
  {
    name: 'PhishFort',
    url: 'https://raw.githubusercontent.com/phishfort/phishfort-lists/master/blacklists/domains.json',
    parser: (data: any[]): string[] => data, // The data is also an array of strings
  },
  // Example of another source that might have a different format
  // {
  //   name: 'SomeOtherList',
  //   url: 'https://example.com/list.json',
  //   parser: (data: any): string[] => data.items.map(item => item.domain),
  // }
];

export async function GET(request: NextRequest) {
  // 1. Security Check: Ensure this endpoint is only called by Vercel's Cron service
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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
        const response = await axios.get<any[]>(source.url);
        const domains = source.parser(response.data);

        if (!Array.isArray(domains) || domains.length === 0) {
          console.warn(`No domains found or invalid format for source: ${source.name}`);
          continue;
        }

        // 3. Prepare bulk database operations to be efficient
        const bulkOps = domains.map(domain => ({
          updateOne: {
            filter: { domain: domain },
            update: {
              $setOnInsert: {
                domain: domain,
                source: source.name,
                createdAt: new Date(),
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
            domains_found: domains.length,
            new_domains_added: domainsAdded,
        };
        summary.push(sourceSummary);
        console.log(`Finished processing ${source.name}. Added ${domainsAdded} new domains.`);

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
