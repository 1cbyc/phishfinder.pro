import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const DB_NAME = process.env.DB_NAME || 'phishdetect';
const COLLECTION_NAME = 'source_blocklists';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const source = searchParams.get('source');
    const limit = parseInt(searchParams.get('limit') || '0');
    const statsOnly = searchParams.get('stats') === 'true';

    const mongoClient = await clientPromise;
    const db = mongoClient.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    let query: any = {};
    if (source) {
      query.sources = source;
    }

    if (statsOnly) {
      const totalDomains = await collection.countDocuments(query);
      
      const sourceStats = await collection.aggregate([
        { $match: query },
        { $unwind: '$sources' },
        { $group: { _id: '$sources', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]).toArray();

      const stats = {
        total_domains: totalDomains,
        sources: sourceStats.map((s: any) => ({
          name: s._id,
          count: s.count,
        })),
        last_updated: await collection.findOne(
          {},
          { sort: { updatedAt: -1 }, projection: { updatedAt: 1 } }
        )?.updatedAt || null,
      };

      return NextResponse.json(stats);
    }

    const cursor = collection.find(query).sort({ updatedAt: -1 });
    if (limit > 0) {
      cursor.limit(limit);
    }

    const domains = await cursor.toArray();

    if (format === 'txt' || format === 'plain') {
      const domainList = domains.map(d => d.domain).join('\n');
      return new NextResponse(domainList, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': 'attachment; filename="phishfinder-blocklist.txt"',
        },
      });
    }

    if (format === 'hosts') {
      const hostsFile = domains.map(d => `0.0.0.0 ${d.domain}`).join('\n');
      return new NextResponse(hostsFile, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': 'attachment; filename="phishfinder-hosts.txt"',
        },
      });
    }

    if (format === 'json') {
      return NextResponse.json({
        total: domains.length,
        domains: domains.map(d => ({
          domain: d.domain,
          sources: d.sources || [],
          first_seen: d.createdAt,
          last_updated: d.updatedAt,
        })),
      });
    }

    return NextResponse.json({ error: 'Invalid format. Use: json, txt, hosts' }, { status: 400 });
  } catch (error: any) {
    console.error('Error fetching blocklist:', error);
    return NextResponse.json(
      { error: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}

