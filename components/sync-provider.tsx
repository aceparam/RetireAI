"use client";

import * as React from "react";
import { useAuth } from "@/lib/auth";
import { usePlanner, SavedScenario } from "@/lib/store";
import { api, RemoteScenario } from "@/lib/api";

function mapScenario(r: RemoteScenario): SavedScenario {
  return { id: r.id, name: r.name, profile: r.profile, createdAt: new Date(r.createdAt).getTime() };
}

/**
 * Keeps the local (offline-first) planner store in sync with the NestJS API
 * whenever the user is signed in. Profile changes are debounced and pushed;
 * scenarios are reconciled on login and mirrored on create/delete.
 *
 * Renders nothing — it's a behavioral provider mounted inside the app shell.
 */
export function SyncProvider() {
  const token = useAuth((s) => s.token);
  const setUser = useAuth((s) => s.setUser);
  const profile = usePlanner((s) => s.profile);
  const scenarios = usePlanner((s) => s.scenarios);

  const reconciled = React.useRef(false);
  const lastPushed = React.useRef<string>("");
  const knownServerIds = React.useRef<Set<string>>(new Set());
  const pushTimer = React.useRef<ReturnType<typeof setTimeout>>();

  // --- Reconcile on sign-in -------------------------------------------------
  React.useEffect(() => {
    if (!token) {
      reconciled.current = false;
      knownServerIds.current = new Set();
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        const me = await api.me();
        if (cancelled) return;
        setUser(me);

        // Profile: prefer the server copy; otherwise seed it from local state.
        const remote = await api.getProfile();
        const planner = usePlanner.getState();
        if (remote?.data) {
          planner.replaceProfile(remote.data);
          lastPushed.current = JSON.stringify(remote.data);
        } else {
          await api.putProfile(planner.profile);
          lastPushed.current = JSON.stringify(planner.profile);
        }

        // Scenarios: pull remote, then push any local-only (client-id) ones.
        const remoteScenarios = await api.listScenarios();
        const merged: SavedScenario[] = remoteScenarios.map(mapScenario);
        const localOnly = usePlanner.getState().scenarios.filter((s) => s.id.startsWith("sc_"));
        for (const local of localOnly) {
          try {
            const created = await api.createScenario(local.name, local.profile);
            merged.push(mapScenario(created));
          } catch {
            /* ignore individual failures */
          }
        }
        knownServerIds.current = new Set(merged.map((s) => s.id));
        usePlanner.getState().setScenarios(merged);

        reconciled.current = true;
      } catch {
        // Network/auth error: stay in offline mode silently.
        reconciled.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // --- Debounced profile push ----------------------------------------------
  React.useEffect(() => {
    if (!token || !reconciled.current) return;
    const serialized = JSON.stringify(profile);
    if (serialized === lastPushed.current) return;
    clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      api
        .putProfile(profile)
        .then(() => {
          lastPushed.current = serialized;
        })
        .catch(() => {});
    }, 1200);
    return () => clearTimeout(pushTimer.current);
  }, [profile, token]);

  // --- Mirror scenario create / delete -------------------------------------
  React.useEffect(() => {
    if (!token || !reconciled.current) return;
    const planner = usePlanner.getState();

    // New client-side scenarios → POST, then swap in the server record.
    const newOnes = scenarios.filter((s) => s.id.startsWith("sc_"));
    newOnes.forEach((local) => {
      api
        .createScenario(local.name, local.profile)
        .then((created) => {
          knownServerIds.current.add(created.id);
          planner.replaceScenarioId(local.id, mapScenario(created));
        })
        .catch(() => {});
    });

    // Removed server scenarios → DELETE.
    const currentServerIds = new Set(scenarios.filter((s) => !s.id.startsWith("sc_")).map((s) => s.id));
    knownServerIds.current.forEach((id) => {
      if (!currentServerIds.has(id)) {
        api.deleteScenario(id).catch(() => {});
        knownServerIds.current.delete(id);
      }
    });
    currentServerIds.forEach((id) => knownServerIds.current.add(id));
  }, [scenarios, token]);

  return null;
}
