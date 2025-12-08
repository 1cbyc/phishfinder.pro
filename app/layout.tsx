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
        <footer className="w-full text-center p-4 mt-auto text-sm text-slate-400">
          <a
            href="https://nsisong.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            Isaac Emmanuel
          </a>{" "}
          © 2023
        </footer>
      </body>
    </html>
  );
}
