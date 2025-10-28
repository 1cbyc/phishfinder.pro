import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    // 1. Check critical environment variables
    const requiredEnvVars = [
      "GOOGLE_SAFE_BROWSING_API_KEY",
      "VIRUSTOTAL_API_KEY",
      "PHISHTANK_API_KEY",
      "DB_NAME",
    ];

    const missingEnvVars: string[] = [];
    const envStatus: Record<string, boolean> = {};

    requiredEnvVars.forEach((varName) => {
      const isPresent = !!process.env[varName];
      envStatus[varName] = isPresent;
      if (!isPresent) {
        missingEnvVars.push(varName);
      }
    });

    // 2. Check database connectivity
    let dbStatus = "connected";
    let blocklistCount = 0;
    let submissionsCount = 0;
    let dbError = null;

    try {
      const mongoClient = await clientPromise;
      const db = mongoClient.db(process.env.DB_NAME || "phishdetect");

      // Perform a simple ping to verify connectivity
      await db.admin().ping();

      // Count documents in our intelligence collections
      blocklistCount = await db.collection("source_blocklists").countDocuments();
      submissionsCount = await db.collection("user_submissions").countDocuments();
    } catch (error: any) {
      dbStatus = "disconnected";
      dbError = error.message;
    }

    // 3. Determine overall health status
    const isHealthy = dbStatus === "connected" && missingEnvVars.length === 0;

    // 4. Return health status
    const response = {
      status: isHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: dbStatus,
          error: dbError,
        },
        environment: {
          status: missingEnvVars.length === 0 ? "ok" : "missing_vars",
          missing: missingEnvVars,
          details: envStatus,
        },
        intelligence: {
          blocklist_domains: blocklistCount,
          user_submissions: submissionsCount,
          total_indicators: blocklistCount + submissionsCount,
        },
      },
    };

    return NextResponse.json(response, {
      status: isHealthy ? 200 : 500,
    });
  } catch (error: any) {
    console.error("Health check error:", error);
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: error.message,
      },
      { status: 500 },
    );
  }
}

