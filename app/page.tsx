"use client";

import { useState } from "react";
import ResultDisplay from "./components/ResultDisplay";

interface AnalysisResult {
  url: string;
  verdict: string;
  source: string;
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

const features = [
  {
    title: "Multi-source intelligence",
    description: "Google Safe Browsing, VirusTotal, curated blocklists, and user reports combined for a single verdict.",
  },
  {
    title: "Fast cache + freshness",
    description: "24h caching for repeat checks, with live rescans when data is stale.",
  },
  {
    title: "Report + enrich",
    description: "Users can report suspicious URLs; blocklists update via scheduled jobs.",
  },
  {
    title: "Built for open source",
    description: "Environment-based secrets, zero hardcoded keys, and clean, auditable code.",
  },
];

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
        headers: { "Content-Type": "application/json" },
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
    <main className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.12),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(16,185,129,0.1),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(124,58,237,0.12),transparent_30%)]" />
      <div className="relative max-w-6xl mx-auto px-4 py-16 space-y-16">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-white">
              PF
            </div>
            <div>
              <p className="text-lg font-semibold">PhishFinder</p>
              <p className="text-sm text-slate-300">URL threat analysis</p>
            </div>
          </div>
        </header>

        <section className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <p className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-slate-200">
              Live URL scanning • Multi-engine verdicts • Open source
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
              Stop phishing links before they land.
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">
                One scan. Clear verdict.
              </span>
            </h1>
            <p className="text-lg text-slate-300 max-w-2xl">
              PhishFinder runs your URL through trusted sources and our internal intelligence to tell you if it’s safe,
              suspicious, or malicious—fast.
            </p>
            <div className="flex flex-wrap gap-2 text-sm text-slate-300">
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">Google Safe Browsing</span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">VirusTotal</span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">Blocklists + reports</span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">24h cache</span>
            </div>
          </div>

          <div className="bg-white text-slate-900 rounded-3xl shadow-2xl p-8 border border-slate-200/60 backdrop-blur">
            <h2 className="text-xl font-semibold mb-2">Scan a URL</h2>
            <p className="text-sm text-slate-500 mb-6">
              No secrets stored. Results are cached for 24 hours and refreshed on demand.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-sm font-medium text-slate-700" htmlFor="url">
                URL to analyze
              </label>
              <input
                id="url"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-400 focus:border-transparent transition"
                required
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-[1px] transition disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {isLoading ? "Analyzing..." : "Analyze URL"}
              </button>
            </form>

            {error && (
              <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>
        </section>

        {result && (
          <section className="bg-white text-slate-900 rounded-3xl shadow-2xl p-6 md:p-8 border border-slate-200/60">
            <ResultDisplay result={result} />
          </section>
        )}

        <section className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8">
          <div className="grid gap-6 md:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:border-white/20 transition"
              >
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-200 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-gradient-to-r from-sky-500/80 to-indigo-600/80 rounded-3xl p-8 md:p-10 border border-white/10 shadow-2xl text-white">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-semibold mb-2">See something suspicious?</h3>
              <p className="text-white/80">
                Report phishing attempts to improve community protection and blocklists.
              </p>
            </div>
            <a
              href="mailto:security@yourdomain.com"
              className="inline-flex items-center gap-2 bg-white text-slate-900 px-5 py-3 rounded-xl font-semibold shadow-lg hover:-translate-y-[1px] transition"
            >
              Report a phish
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
