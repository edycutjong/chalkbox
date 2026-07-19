import { LIVE_GENERATION_ENABLED } from "@/lib/demo";
import {
  RealOrchestrator,
  StubOrchestrator,
  type GenerationAttemptListener,
  type GenerationOrchestrator,
} from "./orchestrator";

/** The one environment seam: no key or forced demo can never spend money. */
export function createOrchestrator(onAttempt?: GenerationAttemptListener): GenerationOrchestrator {
  if (!LIVE_GENERATION_ENABLED) return new StubOrchestrator();
  return new RealOrchestrator(undefined, onAttempt);
}
