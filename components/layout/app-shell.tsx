"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, PiggyBank, Sparkles } from "lucide-react";
import { NAV_ITEMS } from "./nav";
import { ThemeToggle } from "../theme-toggle";
import { AuthButton } from "../auth-button";
import { SyncProvider } from "../sync-provider";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { usePlanner } from "@/lib/store";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const profile = usePlanner((s) => s.profile);

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <Link href="/dashboard" className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-500 text-white shadow-lg">
          <PiggyBank className="h-5 w-5" />
        </span>
        <div className="leading-tight">
          <p className="text-base font-bold">RetireAI</p>
          <p className="text-[11px] text-muted-foreground">Plan with confidence</p>
        </div>
      </Link>

      <nav className="scrollbar-thin flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-primary")} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <Link
          href="/coach"
          className="flex items-center gap-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 p-3 text-sm transition-colors hover:from-primary/20"
        >
          <Sparkles className="h-5 w-5 text-primary" />
          <div>
            <p className="font-semibold text-foreground">Ask the AI Coach</p>
            <p className="text-[11px] text-muted-foreground">Get personalized advice</p>
          </div>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <SyncProvider />
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card/50 lg:block">
        <div className="sticky top-0 h-screen">{SidebarContent}</div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 border-r border-border bg-card shadow-2xl animate-fade-in">
            <button
              className="absolute right-3 top-4 rounded-lg p-1.5 hover:bg-accent"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <CurrentPageTitle pathname={pathname} />
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {profile.name ? `Hi, ${profile.name}` : capitalize(profile.persona)}
            </span>
            <AuthButton compact />
            <ThemeToggle />
          </div>
        </header>

        <main className="gradient-bg flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl animate-slide-up">{children}</div>
        </main>
      </div>
    </div>
  );
}

function CurrentPageTitle({ pathname }: { pathname: string }) {
  const item = NAV_ITEMS.find((i) => i.href === pathname);
  if (!item) return null;
  return <p className="truncate text-sm font-semibold sm:text-base">{item.label}</p>;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
