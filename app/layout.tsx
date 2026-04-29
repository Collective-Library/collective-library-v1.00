import type { Metadata, Viewport } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-dm-serif-display",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Collective Library",
    template: "%s · Collective Library",
  },
  description:
    "Where books connect people, and ideas turn into movement. Sebuah katalog buku kolektif + jaringan pembaca yang saling berbagi, berdiskusi, dan berkembang bareng.",
  applicationName: "Collective Library",
  keywords: [
    "buku bekas Semarang",
    "pinjam buku",
    "tukar buku",
    "Collective Library",
    "Journey Perintis",
  ],
};

export const viewport: Viewport = {
  themeColor: "#F0E8D8",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${dmSans.variable} ${dmSerifDisplay.variable} h-full antialiased`}
      style={
        {
          "--font-sans": "var(--font-dm-sans)",
          "--font-display": "var(--font-dm-serif-display)",
        } as React.CSSProperties
      }
    >
      <body className="min-h-full bg-parchment text-ink">{children}</body>
    </html>
  );
}
