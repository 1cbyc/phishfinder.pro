import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { checkGoogleSafeBrowsing } from "@/lib/googleSafeBrowsing";
import { checkVirusTotal } from "@/lib/virusTotal";

const DB_NAME = process.env.DB_NAME || "phishdetect";
const CACHE_COLLECTION = "url_analysis_cache";
const SUBMISSIONS_COLLECTION = "user_submissions";
const BLOCKLIST_COLLECTION = "source_blocklists";
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Extracts the hostname from a given URL for blocklist checking.
 * @param url The URL to parse.
 * @returns The hostname or null if the URL is invalid.
 */
const getDomain = (url: string): string | null => {
  try {
    let hostname = new URL(url).hostname;
    // Remove "www." prefix to standardize the domain
    return hostname.startsWith("www.") ? hostname.slice(4) : hostname;
  } catch (error) {
    console.error(`Could not parse domain from URL: ${url}`, error);
    return null;
  }
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL is required and must be a string." },
        { status: 400 },
      );
    }

    // Ensure URL has a protocol for accurate parsing and API calls
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "http://" + url;
    }

    const mongoClient = await clientPromise;
    const db = mongoClient.db(DB_NAME);

    // --- 1. Check Internal Intelligence First ---

    // Check #1: User-submitted malicious URLs
    const userSubmission = await db
      .collection(SUBMISSIONS_COLLECTION)
      .findOne({ url });
    if (userSubmission) {
      console.log(`Malicious URL identified from user submissions: ${url}`);
      return NextResponse.json({
        url,
        verdict: "Malicious",
        source: "User Submission",
        scannedAt: new Date().toISOString(),
        report: {
          internalBlock: { isMalicious: true, source: "User Submission" },
        },
      });
    }

    // Check #2: Curated source blocklists (by domain)
    const domain = getDomain(url);
    if (domain) {
      const blockedDomain = await db
        .collection(BLOCKLIST_COLLECTION)
        .findOne({ domain });
      if (blockedDomain) {
        console.log(
          `Malicious domain identified from source blocklist: ${domain}`,
        );
        return NextResponse.json({
          url,
          verdict: "Malicious",
          source: `Blocklist (${blockedDomain.source})`,
          scannedAt: new Date().toISOString(),
          report: {
            internalBlock: {
              isMalicious: true,
              source: `Blocklist (${blockedDomain.source})`,
            },
          },
        });
      }
    }

    // --- 2. Check for a fresh, cached result from external APIs ---
    const cacheCollection = db.collection(CACHE_COLLECTION);
    const cachedData = await cacheCollection.findOne({ url: url });
    if (cachedData) {
      const isCacheFresh =
        new Date().getTime() -
          new Date(cachedData.last_scanned_at as Date).getTime() <
        CACHE_DURATION_MS;
      if (isCacheFresh) {
        console.log(`Returning fresh cached result for: ${url}`);
        return NextResponse.json({
          ...(cachedData.full_report as object),
          source: "cache",
        });
      }
    }

    console.log(`Performing live analysis for: ${url}`);

    // --- 3. Perform Live Analysis (Cache Miss) ---
    const [googleResult, virusTotalResult] = await Promise.allSettled([
      checkGoogleSafeBrowsing(url),
      checkVirusTotal(url),
    ]);

    const googleReport =
      googleResult.status === "fulfilled"
        ? googleResult.value
        : { isMalicious: false, threatTypes: [], error: "Check failed" };
    const virusTotalReport =
      virusTotalResult.status === "fulfilled"
        ? virusTotalResult.value
        : { isMalicious: false, positives: 0, total: 0, error: "Check failed" };

    // --- 4. Aggregate Results for a Final Verdict ---
    let finalVerdict = "Safe";
    if (googleReport.isMalicious || (virusTotalReport && virusTotalReport.positives > 5)) {
      finalVerdict = "Malicious";
    } else if (virusTotalReport && virusTotalReport.positives > 0) {
      finalVerdict = "Suspicious";
    }

    const report = {
      googleSafeBrowsing: googleReport,
      virusTotal: virusTotalReport,
    };

    const responsePayload = {
      url,
      verdict: finalVerdict,
      source: "live" as const,
      scannedAt: new Date().toISOString(),
      report,
    };

    // --- 5. Store the new result in the cache ---
    await cacheCollection.updateOne(
      { url: url },
      {
        $set: {
          full_report: responsePayload,
          last_scanned_at: new Date(responsePayload.scannedAt),
        },
      },
      { upsert: true },
    );
    console.log(`Successfully cached result for: ${url}`);

    // --- 6. Return the live analysis result ---
    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("Error in analyze endpoint:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 },
    );
  }
}
