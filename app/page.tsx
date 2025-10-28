"use client";

import { useState } from "react";
import ResultDisplay from "./components/ResultDisplay";

// Define the structure of the analysis result, matching the API response
interface AnalysisReport {
  googleSafeBrowsing: {
    isMalicious: boolean;
    threatTypes?: string[];
    error?: string;
  };
  virusTotal: {
    isMalicious: boolean;
    positives: number;
    total: number;
    error?: string;
  };
  phishTank: { isKnownPhish: boolean; error?: string };
}

interface AnalysisResult {
  url: string;
  verdict: string;
  source: "cache" | "live";
  scannedAt: string;
  report: AnalysisReport;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
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
        setError(data.error || "An error occurred");
        return;
      }

      setResult(data);
    } catch (err) {
      setError("Failed to connect to the server");
    } finally {
      setLoading(false);
    }
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case "Malicious":
        return "bg-red-500";
      case "Suspicious":
        return "bg-yellow-500";
      case "Safe":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
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
          <p className="text-sm text-gray-500 mt-2">
            Powered by Google Safe Browsing, VirusTotal, and PhishTank
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
                placeholder="https://example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              {loading ? "Analyzing..." : "Analyze URL"}
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
        {result && (
          <div className="space-y-6">
            {/* Verdict Card */}
            <div
              className={`bg-white rounded-2xl shadow-xl p-8 border-t-4 ${getVerdictColor(result.verdict)}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Analysis Result
                  </h2>
                  <p className="text-sm text-gray-500">
                    Scanned from{" "}
                    {result.source === "cache" ? "cache" : "live scan"}
                  </p>
                </div>
                <div className="text-right">
                  <div
                    className={`text-4xl font-bold ${getScoreColor(result.confidenceScore)}`}
                  >
                    {result.confidenceScore}%
                  </div>
                  <div className="text-sm text-gray-500">Confidence</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className={`px-4 py-2 rounded-full text-white font-semibold ${getVerdictColor(result.verdict)}`}
                >
                  {result.verdict}
                </div>
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm truncate"
                >
                  {result.url}
                </a>
              </div>
            </div>

            {/* Detailed Report */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Detailed Report
              </h3>
              <div className="space-y-6">
                {/* Google Safe Browsing */}
                {result.report.googleSafeBrowsing && (
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      🔒 Google Safe Browsing
                    </h4>
                    <p
                      className={`font-medium ${result.report.googleSafeBrowsing.isMalicious ? "text-red-600" : "text-green-600"}`}
                    >
                      {result.report.googleSafeBrowsing.isMalicious
                        ? "⚠️ Malicious detected"
                        : "✓ Safe"}
                    </p>
                    {result.report.googleSafeBrowsing.threatTypes &&
                      result.report.googleSafeBrowsing.threatTypes.length >
                        0 && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600">
                            Threat types:{" "}
                            {result.report.googleSafeBrowsing.threatTypes.join(
                              ", ",
                            )}
                          </p>
                        </div>
                      )}
                  </div>
                )}

                {/* VirusTotal */}
                {result.report.virusTotal && (
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      🦠 VirusTotal
                    </h4>
                    <p className="text-gray-700">
                      {result.report.virusTotal.positives} out of{" "}
                      {result.report.virusTotal.total} scanners flagged this URL
                    </p>
                    {result.report.virusTotal.scanDate && (
                      <p className="text-sm text-gray-500 mt-1">
                        Last scanned:{" "}
                        {new Date(
                          result.report.virusTotal.scanDate,
                        ).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {/* PhishTank */}
                {result.report.phishTank && (
                  <div className="border-l-4 border-orange-500 pl-4">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      🎣 PhishTank
                    </h4>
                    <p
                      className={`font-medium ${result.report.phishTank.isKnownPhish ? "text-red-600" : "text-green-600"}`}
                    >
                      {result.report.phishTank.isKnownPhish
                        ? "⚠️ Known phishing site"
                        : "✓ Not in database"}
                    </p>
                    {result.report.phishTank.verified && (
                      <p className="text-sm text-gray-500 mt-1">
                        ✓ Verified by PhishTank community
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Scan Info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Scan completed: {new Date(result.scannedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>PhishDetect © 2023 | Built with Next.js & TypeScript</p>
        </div>
      </div>
    </main>
  );
}
