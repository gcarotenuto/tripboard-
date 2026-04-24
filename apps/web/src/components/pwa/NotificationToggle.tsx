"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";

function urlBase64ToBuffer(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const arr = Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
  return arr.buffer.slice(arr.byteOffset, arr.byteOffset + arr.byteLength) as ArrayBuffer;
}

export function NotificationToggle() {
  const [supported, setSupported] = useState(false);
  const [status, setStatus] = useState<"default" | "granted" | "denied">("default");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setSupported(true);
    setStatus(Notification.permission as "default" | "granted" | "denied");

    // Check if already subscribed
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setSubscribed(!!sub);
    }).catch(() => {});
  }, []);

  const subscribe = async () => {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) return;

    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      setStatus(permission as "default" | "granted" | "denied");
      if (permission !== "granted") return;

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToBuffer(vapidKey),
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });

      setSubscribed(true);
    } catch {
      // User denied or other error
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await fetch("/api/push/subscribe", { method: "DELETE" });
      }
      setSubscribed(false);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (!supported || status === "denied") return null;

  return (
    <button
      onClick={subscribed ? unsubscribe : subscribe}
      disabled={loading}
      title={subscribed ? "Disable trip reminders" : "Enable trip reminders"}
      className={`flex items-center gap-3 w-full rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
        subscribed
          ? "text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-950/50 dark:hover:bg-indigo-950"
          : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-500 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-200"
      }`}
    >
      {subscribed
        ? <Bell className="h-4 w-4 shrink-0 text-indigo-500" />
        : <BellOff className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-600" />
      }
      {subscribed ? "Reminders on" : "Enable reminders"}
    </button>
  );
}
