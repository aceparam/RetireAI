"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PiggyBank } from "lucide-react";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  // Guard against hydration mismatch from the persisted (localStorage) store.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 text-muted-foreground">
        <PiggyBank className="h-6 w-6 animate-pulse text-primary" />
        <span className="text-sm">Loading your plan…</span>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
