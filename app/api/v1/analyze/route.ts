import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { checkGoogleSafeBrowsing } from "@/lib/googleSafeBrowsing";
import { checkVirusTotal } from "@/lib/virusTotal";
import { checkPhishTank } from "@/lib/phishTank";

// Define the structure for documents in our MongoDB collection
interface CachedAnalysis {
  _id?: string;
  url: string;
  final_verdict: string;
  full_report: object;
  last_scanned_at: Date;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME);
    const collection = db.collection<CachedAnalysis>("url_analysis_cache");

    // --- 1. Check for a fresh result in the cache ---
    const cachedData = await collection.findOne({ url });

    const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
    if (cachedData) {
      const isCacheFresh =
        new Date().getTime() - new Date(cachedData.last_scanned_at).getTime() <
        CACHE_DURATION_MS;
      if (isCacheFresh) {
        console.log(`Returning fresh cached result for: ${url}`);
        return NextResponse.json({
          ...(cachedData.full_report as any),
          source: "cache",
        });
      }
    }

    console.log(`Performing live analysis for: ${url}`);

    // --- 2. Call external APIs (Cache Miss) ---
    const googleResult = await checkGoogleSafeBrowsing(url);
    // TODO: Integrate other services (VirusTotal, PhishTank) and run in parallel.

    // --- 3. Aggregate results ---
    const finalVerdict = googleResult.isMalicious ? "Malicious" : "Safe";

    const report = {
      googleSafeBrowsing: googleResult,
    };

    // Calculate confidence score based on results
    const confidenceScore = googleResult.isMalicious ? 0 : 100;

    const responsePayload = {
      url,
      verdict: finalVerdict,
      confidenceScore,
      source: "live" as const,
      scannedAt: new Date().toISOString(),
      report,
    };

    // --- 4. Store the new result in the cache ---
    try {
      await collection.updateOne(
        { url: url },
        {
          $set: {
            final_verdict: finalVerdict,
            full_report: responsePayload,
            last_scanned_at: new Date(),
          },
        },
        { upsert: true }, // This will insert a new document if one doesn't exist
      );
      console.log(`Successfully cached result for: ${url}`);
    } catch (cacheWriteError) {
      console.error("MongoDB cache write error:", cacheWriteError);
      // Non-blocking error: we still return the result to the user.
    }

    // --- 5. Return the live analysis result ---
    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("Error in analyze endpoint:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 },
    );
  }
}
