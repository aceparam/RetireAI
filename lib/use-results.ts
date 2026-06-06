"use client";

import { useMemo } from "react";
import { usePlanner } from "./store";
import { projectRetirement } from "./finance";

/** Live retirement projection derived from the current profile. */
export function useResults() {
  const profile = usePlanner((s) => s.profile);
  const result = useMemo(() => projectRetirement(profile), [profile]);
  return { profile, result };
}
