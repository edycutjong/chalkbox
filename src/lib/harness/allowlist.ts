/**
 * The frozen import allowlist + forbidden-globals set.
 * Mirrors docs/COMPLEXITY.md §2.4 verbatim — this is the security policy that
 * makes model-generated code safe to execute at all.
 */

export const IMPORT_ALLOWLIST = Object.freeze({
  react: { pin: "18.3.1", exports: ["*"] },
  "react-dom/client": { pin: "18.3.1", exports: ["createRoot"] },
  "@chalkbox/kit": {
    pin: "workspace",
    exports: [
      "Draggable",
      "NumberLine",
      "FractionBar",
      "Vector2D",
      "PhysicsWorld",
      "Slider",
      "Grid",
      "clamp",
      "lerp",
      "useAnimationFrame",
    ],
  },
} as const);

export const ALLOWED_IMPORT_SPECIFIERS: readonly string[] = Object.freeze(
  Object.keys(IMPORT_ALLOWLIST),
);

/**
 * Explicitly forbidden — scanned for, not merely "not allowed".
 * Any reference to one of these in generated code fails G2.
 */
export const FORBIDDEN_GLOBALS: readonly string[] = Object.freeze([
  "fetch",
  "XMLHttpRequest",
  "WebSocket",
  "EventSource",
  "navigator.sendBeacon",
  "localStorage",
  "sessionStorage",
  "indexedDB",
  "document.cookie",
  "eval",
  "Function",
  "importScripts",
  "Worker",
  "SharedWorker",
  "postMessage",
  "window.parent",
  "window.top",
  "window.opener",
  "require",
  "process",
  "child_process",
  "fs",
  "__proto__",
  "constructor.constructor",
]);

/** Network APIs get the more specific NETWORK_API rule for clearer traces. */
export const NETWORK_GLOBALS: readonly string[] = Object.freeze([
  "fetch",
  "XMLHttpRequest",
  "WebSocket",
  "EventSource",
  "navigator.sendBeacon",
]);

/** Proto-pollution markers. */
export const PROTO_MARKERS: readonly string[] = Object.freeze([
  "__proto__",
  "constructor.constructor",
]);

/** Size/complexity caps (docs/COMPLEXITY.md §2.5 step 6). */
export const SIZE_CAPS = Object.freeze({
  maxNodeCount: 20_000,
  maxDepth: 40,
});
