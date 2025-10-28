"use client";

interface Report {
  googleSafeBrowsing?: {
    isMalicious: boolean;
    threatTypes?: string[];
  };
  virusTotal?: {
    positives: number;
    total: number;
    scanDate?: string;
  };
  phishTank?: {
    isKnownPhish: boolean;
    verified?: boolean;
  };
}

interface AnalysisResult {
  url: string;
  verdict: "Safe" | "Suspicious" | "Malicious";
  confidenceScore: number;
  scannedAt: string;
  source: "cache" | "live";
  report: Report;
}

interface ResultDisplayProps {
  result: AnalysisResult;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result }) => {
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
                result.report.googleSafeBrowsing.threatTypes.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      Threat types:{" "}
                      {result.report.googleSafeBrowsing.threatTypes.join(", ")}
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
                  {new Date(result.report.virusTotal.scanDate).toLocaleString()}
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
  );
};

export default ResultDisplay;

