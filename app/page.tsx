"use client";

import { useState } from "react";
import ResultDisplay from "./components/ResultDisplay";

// Define the final, correct structure for the analysis result
interface AnalysisResult {
  url: string;
  verdict: string;
  source: string; // e.g., 'cache', 'live', 'User Submission', 'Blocklist'
  scannedAt: string;
  report: {
    googleSafeBrowsing?: {
      isMalicious: boolean;
      threatTypes?: string[];
      error?: string;
    };
    virusTotal?: {
      isMalicious: boolean;
      positives: number;
      total: number;
      error?: string;
    };
    internalBlock?: {
      isMalicious: boolean;
      source: string;
    };
  };
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/v1/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "An unknown error occurred");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🛡️ PhishDetect
          </h1>
          <p className="text-xl text-gray-600">
            Advanced URL Security Analysis
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="url"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Enter URL to Analyze
              </label>
              <input
                id="url"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                required
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              {isLoading ? "Analyzing..." : "Analyze URL"}
            </button>
          </form>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <p className="text-red-800 font-medium">Error: {error}</p>
          </div>
        )}

        {/* Results */}
        {result && <ResultDisplay result={result} />}

        {/* The global footer from layout.tsx will be used, so no footer is needed here. */}
      </div>
    </main>
  );
}
