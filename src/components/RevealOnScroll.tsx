"use client";

import { useEffect } from "react";

/**
 * RevealOnScroll — progressive-enhancement scroll reveal.
 *
 * Elements marked `.reveal` are fully visible by default (no-JS safe, and the
 * server HTML never hides content). Only once this mounts do we "arm" them
 * (hide + offset), then fade each in as it scrolls into view. Under
 * prefers-reduced-motion we skip straight to shown. Renders nothing.
 */
export function RevealOnScroll() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    if (els.length === 0) return;

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || typeof IntersectionObserver === "undefined") {
      els.forEach((el) => el.classList.add("reveal-shown"));
      return;
    }

    // Arm (hide) elements, staggering siblings within the same grid for polish.
    els.forEach((el) => {
      el.classList.add("reveal-armed");
      const siblings = el.parentElement ? Array.from(el.parentElement.children) : [];
      const idx = siblings.indexOf(el);
      if (idx > 0) el.style.transitionDelay = `${Math.min(idx, 5) * 70}ms`;
    });

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-shown");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
