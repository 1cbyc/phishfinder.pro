import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const grotesk = localFont({
  src: [
    { path: "./fonts/grotesk/SpaceGrotesk-Regular.woff", weight: "400", style: "normal" },
    { path: "./fonts/grotesk/SpaceGrotesk-Medium.woff", weight: "500", style: "normal" },
  ],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PhishFinder",
  description: "Multi-source phishing URL analysis with clear verdicts.",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${grotesk.className} flex flex-col min-h-screen bg-slate-950`}>
        <main className="flex-grow">{children}</main>
        <footer className="w-full p-5 mt-auto text-sm text-slate-300 bg-slate-950/80 border-t border-white/5">
          <div className="flex flex-col items-center gap-1 text-center">
            <span className="text-slate-400">© 2023 - Isaac Emmanuel</span>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-slate-300">
              <a
                href="https://nsisong.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                My Portfolio
              </a>
              <span className="hidden sm:inline text-slate-600">|</span>
              <a
                href="https://nsisonglabs.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                My Agency
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
