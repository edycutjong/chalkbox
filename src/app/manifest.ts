import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Chalkbox — self-tested math & physics manipulatives",
    short_name: "Chalkbox",
    description:
      "A teacher types a misconception; Codex builds, self-tests, and publishes a live interactive manipulative behind a phone-friendly share link.",
    start_url: "/",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#020617",
    categories: ["education"],
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
