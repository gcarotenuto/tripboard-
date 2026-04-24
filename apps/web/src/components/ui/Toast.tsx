"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) { clearTimeout(timer); timers.current.delete(id); }
  }, []);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
    const timer = setTimeout(() => dismiss(id), 3500);
    timers.current.set(id, timer);
  }, [dismiss]);

  useEffect(() => {
    const map = timers.current;
    return () => { map.forEach(clearTimeout); };
  }, []);

  const ICONS = { success: CheckCircle, error: XCircle, info: Info };
  const COLORS = {
    success: "border-emerald-200 dark:border-emerald-800 bg-white dark:bg-zinc-900",
    error: "border-red-200 dark:border-red-800 bg-white dark:bg-zinc-900",
    info: "border-indigo-200 dark:border-indigo-800 bg-white dark:bg-zinc-900",
  };
  const ICON_COLORS = {
    success: "text-emerald-500",
    error: "text-red-500",
    info: "text-indigo-500",
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => {
          const Icon = ICONS[t.type];
          return (
            <div
              key={t.id}
              className={`
                pointer-events-auto flex items-center gap-3 rounded-2xl border shadow-xl shadow-zinc-900/10
                px-4 py-3 min-w-[220px] max-w-[320px]
                animate-[slideUp_0.2s_ease-out,fadeIn_0.2s_ease-out]
                ${COLORS[t.type]}
              `}
            >
              <Icon className={`h-4 w-4 shrink-0 ${ICON_COLORS[t.type]}`} />
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 flex-1">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 p-0.5 rounded-md text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 dark:hover:text-zinc-400 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
