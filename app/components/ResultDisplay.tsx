"use client";

import { useState } from "react";

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

interface ResultDisplayProps {
  result: AnalysisResult;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result }) => {
  const [reportStatus, setReportStatus] = useState<
    "idle" | "reporting" | "reported"
  >("idle");

  const handleReport = async () => {
    setReportStatus("reporting");
    try {
      const res = await fetch("/api/v1/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: result.url }),
      });
      if (!res.ok) throw new Error("Report failed");
      setReportStatus("reported");
    } catch (error) {
      console.error("Failed to report URL:", error);
      setReportStatus("idle"); // Optionally show an error message
    }
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict.toLowerCase()) {
      case "malicious":
        return "border-red-500";
      case "suspicious":
        return "border-yellow-500";
      case "safe":
        return "border-green-500";
      default:
        return "border-gray-500";
    }
  };

  const getVerdictTextColor = (verdict: string) => {
    switch (verdict.toLowerCase()) {
      case "malicious":
        return "text-red-600";
      case "suspicious":
        return "text-yellow-600";
      case "safe":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Verdict Card */}
      <div
        className={`bg-white rounded-2xl shadow-xl p-8 border-t-4 ${getVerdictColor(result.verdict)}`}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Analysis Result
            </h2>
            <p className="text-sm text-gray-500">Source: {result.source}</p>
          </div>
          <div
            className={`text-2xl font-bold ${getVerdictTextColor(result.verdict)}`}
          >
            {result.verdict}
          </div>
        </div>
        <a
          href={result.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 text-sm truncate block"
        >
          {result.url}
        </a>
      </div>

      {/* Detailed Report */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          Detailed Report
        </h3>
        <div className="space-y-6">
          {/* Internal Block Report */}
          {result.report.internalBlock && (
            <div className="border-l-4 border-red-500 pl-4">
              <h4 className="font-semibold text-gray-900 mb-2">
                🛡️ Internal Intelligence
              </h4>
              <p className="font-medium text-red-600">
                ⚠️ Malicious ({result.report.internalBlock.source})
              </p>
            </div>
          )}

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
            </div>
          )}
        </div>

        {/* Footer with Report Button */}
        <div className="mt-6 pt-6 border-t border-gray-200 flex justify-between items-center">
          <p className="text-sm text-gray-500">
            Scan completed: {new Date(result.scannedAt).toLocaleString()}
          </p>
          {result.verdict.toLowerCase() !== "malicious" &&
            reportStatus !== "reported" && (
              <button
                onClick={handleReport}
                disabled={reportStatus === "reporting"}
                className="text-sm text-blue-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reportStatus === "reporting"
                  ? "Submitting..."
                  : "Report as Phishing"}
              </button>
            )}
          {reportStatus === "reported" && (
            <span className="text-sm text-green-600 font-semibold">
              ✓ Reported. Thank you!
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultDisplay;
