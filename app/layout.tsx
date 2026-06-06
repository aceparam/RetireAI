import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "RetireAI — Plan Your Retirement with Confidence",
  description:
    "A comprehensive retirement planning platform for India. Estimate your corpus, run Monte Carlo simulations, optimize taxes, and get AI-powered recommendations.",
  keywords: ["retirement planning", "FIRE calculator", "India", "SIP", "NPS", "financial independence"],
  authors: [{ name: "RetireAI" }],
};

export const viewport: Viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
