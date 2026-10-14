// src/lib/guest-limit.ts
// Guests (not signed in) can finish a few stages first; after that a new stage asks them to sign in to go on.
// Stages they already finished stay open, and their progress on this phone moves into the account they sign in to.

import { useSyncExternalStore } from "react";
import { supabase } from "@/lib/supabase";
import { useUserStore } from "@/store/useUserStore";
import { useLanguageStore } from "@/store/useLanguageStore";

/** How many stages a guest can finish before signing in */
export const GUEST_FREE_STAGES = 3;

const countDone = (r?: Record<string, boolean>) => Object.values(r ?? {}).filter(Boolean).length;

/** Whether Supabase has a session saved in this browser (cookie or localStorage "sb-<project>-auth-token") */
function hasStoredSession(): boolean {
  if (/(^|;\s*)sb-[^=]*-auth-token/.test(document.cookie)) return true;
  try {
    return Object.keys(localStorage).some((k) => /^sb-.*-auth-token/.test(k));
  } catch {
    return true; // storage blocked: let Supabase decide
  }
}

// Signed in or not, shared by every page: first a guess from the saved session (so a stage never flashes before
// the sign-in screen), then what Supabase says
let signedIn: boolean | null = null;
const listeners = new Set<() => void>();
let watching = false;
function watchAuth() {
  if (watching) return;
  watching = true;
  if (!hasStoredSession()) signedIn = false;
  const set = (v: boolean) => {
    if (signedIn === v) return;
    signedIn = v;
    listeners.forEach((l) => l());
  };
  void supabase.auth.getSession().then(({ data: { session } }) => set(!!session));
  supabase.auth.onAuthStateChange((_event, session) => set(!!session));
}
function subscribe(listener: () => void) {
  watchAuth();
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
const getSnapshot = () => {
  watchAuth();
  return signedIn;
};
const getServerSnapshot = () => null;

/** Whether this stage is closed for a guest who has used their free stages (false while sign-in is not known yet) */
export function useGuestLimit(stageId: string): boolean {
  const isSignedIn = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const enCompleted = useUserStore((s) => s.completedStages);
  const progress = useLanguageStore((s) => s.progress);

  if (isSignedIn !== false) return false;
  const finished = countDone(enCompleted) + Object.values(progress).reduce((n, p) => n + countDone(p?.completedStages), 0);
  const alreadyDone = enCompleted[stageId] === true || Object.values(progress).some((p) => p?.completedStages?.[stageId] === true);
  return finished >= GUEST_FREE_STAGES && !alreadyDone;
}
