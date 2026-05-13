import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "APAC KYC API — x402 Powered Corporate Verification",
  description:
    "APAC各国の公的法人データベースを横断した標準化KYCレポートをx402決済で提供。Japan / Singapore / Hong Kong / Australia / Korea 対応。",
  openGraph: {
    title: "APAC KYC API",
    description:
      "x402-powered corporate KYC & AML screening across APAC — JP, SG, HK, AU, KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen bg-dark text-white font-outfit antialiased">
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-dark-border bg-dark/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-2">
                <span className="text-gold font-bold text-lg font-outfit">
                  APAC KYC
                </span>
                <span className="text-gray-600 text-xs px-2 py-0.5 border border-dark-border rounded-full">
                  x402
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <a
                  href="#api"
                  className="text-gray-400 hover:text-white transition-colors animated-underline"
                >
                  API
                </a>
                <a
                  href="#agentic"
                  className="text-gray-400 hover:text-white transition-colors animated-underline"
                >
                  Agentic
                </a>
                <a
                  href="/.well-known/x402.json"
                  target="_blank"
                  className="text-gray-400 hover:text-gold transition-colors text-xs"
                >
                  x402.json
                </a>
              </div>
            </div>
          </div>
        </nav>
        <main className="pt-14">{children}</main>
        <footer className="border-t border-dark-border mt-24 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-gray-600 text-xs font-outfit">
              APAC KYC API — Powered by{" "}
              <a
                href="https://x402.org"
                target="_blank"
                rel="noreferrer"
                className="text-gold hover:text-gold-light transition-colors"
              >
                x402
              </a>{" "}
              · Data from public government sources ·{" "}
              <a
                href="/.well-known/x402.json"
                className="text-gold hover:text-gold-light transition-colors"
              >
                Discovery
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
