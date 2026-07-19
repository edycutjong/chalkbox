import type { MetadataRoute } from "next";

const BASE = "https://chalkbox.edycu.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/gallery`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/create`, changeFrequency: "monthly", priority: 0.7 },
  ];
}
