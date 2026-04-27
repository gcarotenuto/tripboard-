"use client";

/**
 * NavigationProgress — slim top-of-page progress bar on route changes.
 * No extra dependencies. Works with Next.js App Router.
 *
 * Strategy:
 *  1. Listen for clicks on <a> / <button> inside Link elements.
 *  2. On click → start animation (0% → 85% over ~800ms, then hold).
 *  3. When usePathname changes → flash to 100% and fade out.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

type State = "idle" | "loading" | "done";

export function NavigationProgress() {
  const pathname = usePathname();
  const [state, setState] = useState<State>("idle");
  const [width, setWidth] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPathname = useRef(pathname);

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const start = useCallback(() => {
    clear();
    setWidth(0);
    setState("loading");
    // Animate to 85% over 800ms
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setWidth(85);
      });
    });
    // Safety: complete after 10s even if pathname never changes
    timerRef.current = setTimeout(() => {
      setWidth(100);
      setState("done");
      timerRef.current = setTimeout(() => setState("idle"), 400);
    }, 10000);
  }, [clear]);

  const complete = useCallback(() => {
    clear();
    setWidth(100);
    setState("done");
    timerRef.current = setTimeout(() => {
      setState("idle");
      setWidth(0);
    }, 400);
  }, [clear]);

  // Detect pathname change → complete
  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname;
      if (state === "loading") {
        complete();
      }
    }
  }, [pathname, state, complete]);

  // Listen for link clicks to start
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href) return;
      // Only internal links, not anchors (#), not external
      if (href.startsWith("#") || href.startsWith("http") || href.startsWith("//")) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      // Don't trigger on download links
      if (link.hasAttribute("download")) return;
      start();
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [start]);

  if (state === "idle") return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[2.5px] pointer-events-none">
      <div
        className="h-full bg-indigo-500"
        style={{
          width: `${width}%`,
          transition: state === "loading"
            ? "width 0.8s cubic-bezier(0.1, 0.05, 0, 1)"
            : "width 0.15s ease-out",
          opacity: state === "done" && width === 100 ? 0 : 1,
          transitionProperty: state === "done" ? "width, opacity" : "width",
          transitionDuration: state === "done" ? "0.15s, 0.35s" : "0.8s",
          transitionDelay: state === "done" ? "0s, 0.15s" : "0s",
        }}
      >
        {/* Glow effect */}
        <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-indigo-400 via-indigo-500/60 to-transparent opacity-70 blur-sm" />
      </div>
    </div>
  );
}
