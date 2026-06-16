import { Fraunces, Geist, Geist_Mono } from "next/font/google";

// Display serif — set thin and large per the design system. Variable wght + optical
// sizing + SOFT axis so headlines stay crisp at large sizes.
export const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
  variable: "--font-fraunces",
  display: "swap",
});

export const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

export const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});
