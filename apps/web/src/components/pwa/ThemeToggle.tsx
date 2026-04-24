"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

function applyTheme(theme: "light" | "dark") {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  localStorage.setItem("theme", theme);
}

export function ThemeToggle({ variant = "sidebar" }: { variant?: "sidebar" | "icon" }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Read persisted preference or fall back to system
    const stored = localStorage.getItem("theme") as "light" | "dark" | null;
    const system = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const resolved = stored ?? system;
    setTheme(resolved);
    applyTheme(resolved);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  };

  if (variant === "icon") {
    return (
      <button
        onClick={toggle}
        title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      >
        {theme === "dark"
          ? <Sun className="h-4 w-4" />
          : <Moon className="h-4 w-4" />
        }
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-3 w-full rounded-xl px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-100 dark:text-zinc-500 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-200 transition-colors"
    >
      {theme === "dark"
        ? <Sun className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-600" />
        : <Moon className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-600" />
      }
      {theme === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
}
