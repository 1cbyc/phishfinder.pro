import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

const DB_NAME = process.env.DB_NAME || 'phishdetect';
const COLLECTION_NAME = 'user_submissions';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url } = body;

    // 1. Validate the input
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: "URL is required and must be a string." }, { status: 400 });
    }

    // A simple regex to check for something that looks like a domain.
    // This is not a perfect URL validator but prevents completely invalid strings.
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (!urlPattern.test(url)) {
        return NextResponse.json({ error: "Invalid URL format." }, { status: 400 });
    }

    // 2. Connect to the database
    const mongoClient = await clientPromise;
    const db = mongoClient.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // 3. Insert or update the submitted URL
    // Using upsert ensures we don't have duplicate URLs.
    // We update the createdAt timestamp to track the most recent report time.
    await collection.updateOne(
      { url: url },
      {
        $set: { updatedAt: new Date() },
        $setOnInsert: { url: url, createdAt: new Date() }
      },
      { upsert: true }
    );

    console.log(`URL reported and added/updated in submissions: ${url}`);

    // 4. Return a success response
    return NextResponse.json({ message: "URL reported successfully. Thank you for improving the community's safety!" }, { status: 200 });

  } catch (error) {
    console.error("Error in report endpoint:", error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: "Invalid JSON in request body." }, { status: 400 });
    }
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 },
    );
  }
}
