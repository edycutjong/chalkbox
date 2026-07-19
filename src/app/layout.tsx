import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Self-hosted display + body + mono fonts (landing-page-guide-v2: distinctive,
// NOT default system fonts). Exposed as CSS variables; globals.css maps the
// design tokens (--font-display/-ui/-mono) onto them for the app only.
const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});
const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

const TITLE = "Chalkbox 🖍️ — a sentence becomes a self-tested manipulative";
const DESCRIPTION =
  "A teacher types a math or physics misconception; Codex builds, self-tests, and publishes a live interactive manipulative behind a phone-friendly share link. The moat is the self-test verification loop.";

export const metadata: Metadata = {
  metadataBase: new URL("https://chalkbox.edycu.dev"),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "Chalkbox",
  keywords: [
    "interactive manipulatives",
    "math manipulatives",
    "physics simulations",
    "teacher tools",
    "AI for education",
    "Codex",
    "GPT-5.6",
    "self-testing code generation",
    "Common Core",
    "NGSS",
  ],
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/icon.svg",
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://chalkbox.edycu.dev",
    siteName: "Chalkbox",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Chalkbox" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
