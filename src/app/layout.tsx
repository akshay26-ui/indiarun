import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aura Agent — Autonomous Product Intelligence",
  description:
    "From idea to launch, fully autonomous. Aura Agent researches your market, builds your roadmap, generates prototypes, and closes the loop with live telemetry.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* ── Premium Typography Stack ────────────────────────────────── */}
        {/* Cabinet Grotesk — Primary display / panel titles (weight 500+) */}
        <link
          rel="preconnect"
          href="https://api.fontshare.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@400,500,700,800&display=swap"
          rel="stylesheet"
        />
        {/* General Sans — Alternative primary (same weight/size tier) */}
        <link
          href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Hanken+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-[#0c0f14] text-[#F2F3F7]" style={{ fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
