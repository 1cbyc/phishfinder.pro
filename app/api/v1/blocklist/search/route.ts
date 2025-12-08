import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const DB_NAME = process.env.DB_NAME || 'phishdetect';
const COLLECTION_NAME = 'source_blocklists';

const normalizeDomain = (domain: string): string => {
  return domain.toLowerCase().trim().replace(/^www\./, '');
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain parameter is required' },
        { status: 400 }
      );
    }

    const normalizedDomain = normalizeDomain(domain);
    const mongoClient = await clientPromise;
    const db = mongoClient.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    const result = await collection.findOne({ domain: normalizedDomain });

    if (!result) {
      return NextResponse.json({
        found: false,
        domain: normalizedDomain,
      });
    }

    return NextResponse.json({
      found: true,
      domain: result.domain,
      sources: result.sources || [],
      first_seen: result.createdAt,
      last_updated: result.updatedAt,
    });
  } catch (error: any) {
    console.error('Error searching blocklist:', error);
    return NextResponse.json(
      { error: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}

