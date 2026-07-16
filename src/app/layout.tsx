import type { Metadata, Viewport } from "next";
import "./globals.css";

const TITLE = "Chalkbox 🖍️ — a sentence becomes a self-tested manipulative";
const DESCRIPTION =
  "A teacher types a math or physics misconception; Codex builds, self-tests, and publishes a live interactive manipulative behind a phone-friendly share link. The moat is the self-test verification loop.";

export const metadata: Metadata = {
  metadataBase: new URL("https://chalkbox.edycu.dev"),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "Chalkbox",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark">
      <body>{children}</body>
    </html>
  );
}
