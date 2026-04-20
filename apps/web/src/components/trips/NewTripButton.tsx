"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewTripButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    const res = await fetch("/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Trip" }),
    });
    if (res.ok) {
      const json = await res.json() as { data: { id: string } };
      router.push(`/trips/${json.data.id}`);
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleCreate}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 active:scale-95 transition-all"
    >
      {loading ? "Creating..." : "+ New Trip"}
    </button>
  );
}
