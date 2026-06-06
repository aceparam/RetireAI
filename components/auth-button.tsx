"use client";

import * as React from "react";
import { LogOut, Cloud, CloudOff } from "lucide-react";
import { useAuth, isAuthEnabled } from "@/lib/auth";
import { api } from "@/lib/api";
import { Button } from "./ui/button";

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
    </svg>
  );
}

/** Sign-in / account control. Auth is additive — the app works without it. */
export function AuthButton({ compact = false }: { compact?: boolean }) {
  const { token, user, logout } = useAuth();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted || !isAuthEnabled) return null;

  if (token) {
    return (
      <div className="flex items-center gap-2">
        {!compact && (
          <span className="hidden items-center gap-1.5 text-xs text-success sm:flex">
            <Cloud className="h-3.5 w-3.5" /> Synced
          </span>
        )}
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.name ?? "You"} className="h-8 w-8 rounded-full border border-border" />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
            {(user?.name ?? user?.email ?? "U").charAt(0).toUpperCase()}
          </span>
        )}
        <Button variant="ghost" size="icon" onClick={logout} aria-label="Sign out" title="Sign out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <a href={api.loginUrl()}>
      <Button variant="outline" size={compact ? "sm" : "md"}>
        <GoogleGlyph />
        {compact ? "Sign in" : "Sign in with Google"}
      </Button>
    </a>
  );
}

/** Small badge showing cloud-sync status for the landing page. */
export function SyncBadge() {
  const token = useAuth((s) => s.token);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted || !isAuthEnabled) return null;
  return token ? (
    <span className="flex items-center gap-1.5"><Cloud className="h-4 w-4 text-success" /> Synced to your account</span>
  ) : (
    <span className="flex items-center gap-1.5"><CloudOff className="h-4 w-4 text-muted-foreground" /> Sign in to sync across devices</span>
  );
}
