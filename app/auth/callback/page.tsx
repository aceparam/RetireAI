"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PiggyBank, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const setToken = useAuth((s) => s.setToken);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    const token = params.get("token");
    if (token) {
      setToken(token);
      const t = setTimeout(() => router.replace("/dashboard"), 900);
      return () => clearTimeout(t);
    }
    setError(true);
    const t = setTimeout(() => router.replace("/"), 1800);
    return () => clearTimeout(t);
  }, [params, router, setToken]);

  return (
    <div className="gradient-bg flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-purple-500 text-white shadow-lg">
        <PiggyBank className="h-7 w-7" />
      </span>
      {error ? (
        <div className="flex items-center gap-2 text-danger">
          <XCircle className="h-5 w-5" /> Sign-in failed. Redirecting…
        </div>
      ) : (
        <div className="flex items-center gap-2 text-success">
          <CheckCircle2 className="h-5 w-5" /> Signed in! Syncing your plan…
        </div>
      )}
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackInner />
    </Suspense>
  );
}
