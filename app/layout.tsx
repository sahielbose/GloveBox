import type { Metadata } from "next";
import { fraunces, geistSans, geistMono } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "GloveBox — Everything your glovebox should know",
    template: "%s · GloveBox",
  },
  description:
    "Open-source car-ownership assistant: track maintenance, watch every recall, sanity-check repair quotes, decode warning lights, and keep a full service history.",
  metadataBase: new URL(process.env.AUTH_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "GloveBox",
    description: "Everything your glovebox should know.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="bg-ink text-chalk font-sans antialiased">{children}</body>
    </html>
  );
}
