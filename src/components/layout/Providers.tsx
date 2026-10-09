"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MotionConfig } from "motion/react";
import { useDemo, useHydration } from "@/lib/store/demo-store";
import { PageSkeleton, Toaster } from "@/components/ui/feedback";

export function Providers({ children }: { children: ReactNode }) {
  const setHydrated = useHydration((s) => s.setHydrated);
  const tick = useDemo((s) => s.tickDeadlines);

  useEffect(() => {
    Promise.resolve(useDemo.persist.rehydrate()).finally(setHydrated);
  }, [setHydrated]);

  // Frontend stand-in for the backend's deadline jobs (§13.4): close votes / confirm or release payments.
  useEffect(() => {
    const t = setInterval(() => tick(), 10_000);
    return () => clearInterval(t);
  }, [tick]);

  return (
    <MotionConfig reducedMotion="user">
      {children}
      <Toaster />
    </MotionConfig>
  );
}

/** Renders children only after browser state is loaded; redirects to /start when not signed in. */
export function RequireSession({ children }: { children: ReactNode }) {
  const hydrated = useHydration((s) => s.hydrated);
  const signedIn = useDemo((s) => s.session.signedIn);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (hydrated && !signedIn) router.replace(`/start?next=${encodeURIComponent(pathname)}`);
  }, [hydrated, signedIn, router, pathname]);

  if (!hydrated || !signedIn) return <PageSkeleton />;
  return <>{children}</>;
}

export function Hydrated({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const hydrated = useHydration((s) => s.hydrated);
  return <>{hydrated ? children : (fallback ?? <PageSkeleton />)}</>;
}
