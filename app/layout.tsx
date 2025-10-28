import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PhishDetect by Isaac Emmanuel",
  description: "A real-time phishing and malware threat scanner.",
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <main className="flex-grow">{children}</main>
        <footer className="w-full text-center p-4 mt-auto text-sm text-gray-500">
          Isaac Emmanuel © 2023 | Built with {"<3"}
        </footer>
      </body>
    </html>
  );
}
