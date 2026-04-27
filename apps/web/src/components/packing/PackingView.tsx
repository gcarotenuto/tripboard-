"use client";

import { useState, useRef } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import { Trash2, Plus, Luggage, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PackingItem {
  id: string;
  listId: string;
  name: string;
  category: string;
  quantity: number;
  isPacked: boolean;
  notes: string | null;
  order: number;
}

interface PackingList {
  id: string;
  tripId: string;
  items: PackingItem[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "CLOTHING",
  "TOILETRIES",
  "DOCUMENTS",
  "ELECTRONICS",
  "HEALTH",
  "MONEY",
  "OTHER",
] as const;

type Category = (typeof CATEGORIES)[number];

const CATEGORY_EMOJI: Record<Category, string> = {
  CLOTHING: "👕",
  TOILETRIES: "🧴",
  DOCUMENTS: "📄",
  ELECTRONICS: "💻",
  HEALTH: "💊",
  MONEY: "💳",
  OTHER: "🎒",
};

const CATEGORY_LABEL: Record<Category, string> = {
  CLOTHING: "Clothing",
  TOILETRIES: "Toiletries",
  DOCUMENTS: "Documents",
  ELECTRONICS: "Electronics",
  HEALTH: "Health",
  MONEY: "Money",
  OTHER: "Other",
};

// ─── Trip templates ───────────────────────────────────────────────────────────

type TemplateItem = { name: string; category: Category; quantity?: number };

const TEMPLATES: Record<string, { label: string; emoji: string; items: TemplateItem[] }> = {
  beach: {
    label: "Beach",
    emoji: "🏖️",
    items: [
      { name: "Swimsuit", category: "CLOTHING", quantity: 2 },
      { name: "Sunscreen SPF 50+", category: "HEALTH" },
      { name: "Flip flops", category: "CLOTHING" },
      { name: "Beach towel", category: "OTHER" },
      { name: "Sunglasses", category: "CLOTHING" },
      { name: "Hat / sun cap", category: "CLOTHING" },
      { name: "After-sun lotion", category: "HEALTH" },
      { name: "Waterproof phone case", category: "ELECTRONICS" },
      { name: "Snorkelling gear", category: "OTHER" },
      { name: "Passport", category: "DOCUMENTS" },
      { name: "Travel insurance docs", category: "DOCUMENTS" },
      { name: "Credit card", category: "MONEY" },
      { name: "Cash (local currency)", category: "MONEY" },
    ],
  },
  city: {
    label: "City",
    emoji: "🏙️",
    items: [
      { name: "Comfortable walking shoes", category: "CLOTHING" },
      { name: "Casual outfit", category: "CLOTHING", quantity: 3 },
      { name: "Light jacket", category: "CLOTHING" },
      { name: "Umbrella", category: "OTHER" },
      { name: "Passport / ID", category: "DOCUMENTS" },
      { name: "City map / guidebook", category: "DOCUMENTS" },
      { name: "Power bank", category: "ELECTRONICS" },
      { name: "Earphones", category: "ELECTRONICS" },
      { name: "Travel adapter", category: "ELECTRONICS" },
      { name: "Toothbrush & toothpaste", category: "TOILETRIES" },
      { name: "Deodorant", category: "TOILETRIES" },
      { name: "Credit card", category: "MONEY" },
      { name: "Cash (local currency)", category: "MONEY" },
      { name: "Pain reliever", category: "HEALTH" },
    ],
  },
  hiking: {
    label: "Hiking",
    emoji: "🥾",
    items: [
      { name: "Hiking boots", category: "CLOTHING" },
      { name: "Moisture-wicking socks", category: "CLOTHING", quantity: 4 },
      { name: "Thermal base layer", category: "CLOTHING" },
      { name: "Waterproof jacket", category: "CLOTHING" },
      { name: "Hiking pants", category: "CLOTHING", quantity: 2 },
      { name: "Trekking poles", category: "OTHER" },
      { name: "Backpack (30–50 L)", category: "OTHER" },
      { name: "Hydration bladder / water bottle", category: "OTHER" },
      { name: "Trail map / GPS device", category: "ELECTRONICS" },
      { name: "Headlamp + spare batteries", category: "ELECTRONICS" },
      { name: "First aid kit", category: "HEALTH" },
      { name: "Blister plasters", category: "HEALTH" },
      { name: "Sunscreen", category: "HEALTH" },
      { name: "Insect repellent", category: "HEALTH" },
      { name: "Passport / ID", category: "DOCUMENTS" },
      { name: "Emergency contacts card", category: "DOCUMENTS" },
      { name: "Cash", category: "MONEY" },
    ],
  },
};

// ─── Fetcher ──────────────────────────────────────────────────────────────────

const fetcher = (url: string) =>
  fetch(url)
    .then((r) => r.json())
    .then((r) => r.data);

// ─── Input / select shared classes ────────────────────────────────────────────

const INPUT_CLASS =
  "rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-zinc-400";

const SELECT_CLASS =
  "rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-2 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-400";

// ─── Main component ───────────────────────────────────────────────────────────

export function PackingView({ tripId }: { tripId: string }) {
  const apiKey = `/api/trips/${tripId}/packing`;
  const { data: list, isLoading } = useSWR<PackingList>(apiKey, fetcher);
  const confettiFired = useRef(false);
  const { toast } = useToast();

  // Add-item form state
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<Category>("OTHER");
  const [adding, setAdding] = useState(false);

  // Delete confirmation
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  // Template picker visibility
  const [showTemplates, setShowTemplates] = useState(false);
  const [applyingTemplate, setApplyingTemplate] = useState(false);

  // ── Derived stats ──────────────────────────────────────────────────────────

  const items = list?.items ?? [];
  const totalCount = items.length;
  const packedCount = items.filter((i) => i.isPacked).length;
  const progressPct = totalCount === 0 ? 0 : Math.round((packedCount / totalCount) * 100);

  // Group by category, only show categories that have items
  const grouped = CATEGORIES.reduce<Record<string, PackingItem[]>>((acc, cat) => {
    const catItems = items.filter((i) => i.category === cat);
    if (catItems.length > 0) acc[cat] = catItems;
    return acc;
  }, {});

  // ── Handlers ───────────────────────────────────────────────────────────────

  async function handleToggle(item: PackingItem) {
    await fetch(`/api/trips/${tripId}/packing/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPacked: !item.isPacked }),
    });
    await globalMutate(apiKey);

    // Confetti when ALL items are packed (fire only once per session)
    const fresh = (await fetch(apiKey).then((r) => r.json()).catch(() => null))?.data;
    if (fresh) {
      const total = fresh.items.length;
      const packed = fresh.items.filter((i: PackingItem) => i.isPacked).length;
      if (total > 0 && packed === total && !confettiFired.current) {
        confettiFired.current = true;
        import("canvas-confetti").then(({ default: confetti }) => {
          confetti({ particleCount: 160, spread: 80, origin: { y: 0.6 },
            colors: ["#6366f1", "#8b5cf6", "#a78bfa", "#34d399", "#fbbf24"] });
          setTimeout(() => confetti({ particleCount: 80, angle: 60, spread: 55,
            origin: { x: 0 }, colors: ["#6366f1", "#34d399"] }), 200);
          setTimeout(() => confetti({ particleCount: 80, angle: 120, spread: 55,
            origin: { x: 1 }, colors: ["#f472b6", "#fbbf24"] }), 400);
        });
      }
      // Reset confetti flag if user un-packs something
      if (packed < total) confettiFired.current = false;
    }
  }

  async function handleDelete(item: PackingItem) {
    setDeletingItemId(null);
    await fetch(`/api/trips/${tripId}/packing/${item.id}`, { method: "DELETE" });
    globalMutate(apiKey);
    toast(`"${item.name}" removed`);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    await fetch(`/api/trips/${tripId}/packing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), category: newCategory }),
    });
    setNewName("");
    setAdding(false);
    globalMutate(apiKey);
  }

  async function handleApplyTemplate(templateKey: string) {
    const template = TEMPLATES[templateKey];
    if (!template) return;
    setApplyingTemplate(true);
    setShowTemplates(false);

    // Add all template items sequentially to preserve order
    for (const item of template.items) {
      await fetch(`/api/trips/${tripId}/packing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: item.name,
          category: item.category,
          quantity: item.quantity ?? 1,
        }),
      });
    }

    setApplyingTemplate(false);
    globalMutate(apiKey);
    toast(`${template.emoji} ${template.label} template applied — ${template.items.length} items added`);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {/* Progress bar skeleton */}
        <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-700 rounded" />
            <div className="h-3 w-16 bg-zinc-100 dark:bg-zinc-800 rounded" />
          </div>
          <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800" />
        </div>
        {/* Items skeleton */}
        {["CLOTHING", "DOCUMENTS", "ELECTRONICS"].map((cat) => (
          <div key={cat} className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
            <div className="h-3.5 w-20 bg-zinc-200 dark:bg-zinc-700 rounded mb-3" />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 py-1.5">
                  <div className="h-4 w-4 rounded bg-zinc-100 dark:bg-zinc-800" />
                  <div className="h-3 flex-1 bg-zinc-100 dark:bg-zinc-800 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {packedCount} of {totalCount} items packed
          </span>
          <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            {progressPct}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {totalCount > 0 && packedCount === totalCount && (
          <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            All packed! Ready to go. ✈️
          </p>
        )}
      </div>

      {/* Templates button */}
      <div className="relative">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTemplates((v) => !v)}
            disabled={applyingTemplate}
            className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:border-indigo-300 hover:text-indigo-700 dark:hover:border-indigo-700 dark:hover:text-indigo-400 transition-colors disabled:opacity-50"
          >
            <Luggage size={15} />
            {applyingTemplate ? "Adding items…" : "Add from template"}
          </button>
        </div>

        {showTemplates && (
          <div className="absolute left-0 top-full mt-2 z-20 flex gap-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg p-3">
            {Object.entries(TEMPLATES).map(([key, tpl]) => (
              <button
                key={key}
                onClick={() => handleApplyTemplate(key)}
                className="flex flex-col items-center gap-1 rounded-xl px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors min-w-[80px]"
              >
                <span className="text-2xl">{tpl.emoji}</span>
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {tpl.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grouped items */}
      {Object.keys(grouped).length === 0 && !applyingTemplate && (
        <div className="rounded-2xl border border-zinc-200/70 dark:border-zinc-800 overflow-hidden">
          {/* Hero */}
          <div className="bg-gradient-to-br from-emerald-50/70 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20 px-8 py-7 text-center">
            <div className="text-5xl mb-3">🎒</div>
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">Your packing list is empty</h3>
            <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
              Start from a trip template or add items manually below.
            </p>
          </div>

          {/* Template shortcuts */}
          <div className="border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-3">Start with a template</p>
            <div className="grid grid-cols-3 gap-2.5">
              {Object.entries(TEMPLATES).map(([key, tpl]) => (
                <button
                  key={key}
                  onClick={() => handleApplyTemplate(key)}
                  disabled={applyingTemplate}
                  className="group flex flex-col items-center gap-2 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 px-3 py-4 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all disabled:opacity-50"
                >
                  <span className="text-2xl">{tpl.emoji}</span>
                  <div>
                    <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">{tpl.label}</p>
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">{tpl.items.length} items</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {CATEGORIES.map((cat) => {
        const catItems = grouped[cat];
        if (!catItems) return null;
        const catPacked = catItems.filter((i) => i.isPacked).length;
        return (
          <div key={cat} className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
            {/* Category header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-lg">{CATEGORY_EMOJI[cat]}</span>
              <span className="flex-1 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                {CATEGORY_LABEL[cat]}
              </span>
              <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium tabular-nums mr-2">
                {catPacked}/{catItems.length}
              </span>
              {catPacked < catItems.length ? (
                <button
                  onClick={async () => {
                    await Promise.all(
                      catItems.filter((i) => !i.isPacked).map((i) =>
                        fetch(`/api/trips/${tripId}/packing/${i.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ isPacked: true }),
                        })
                      )
                    );
                    globalMutate(apiKey);
                  }}
                  className="text-[10px] font-semibold text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                  title="Mark all packed"
                >
                  Pack all
                </button>
              ) : (
                <span className="text-[10px] font-semibold text-emerald-500">✓ Done</span>
              )}
            </div>

            {/* Items */}
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {catItems.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-center gap-3 px-4 py-2.5"
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggle(item)}
                    className={`shrink-0 h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                      item.isPacked
                        ? "bg-indigo-600 border-indigo-600"
                        : "border-zinc-300 dark:border-zinc-600 hover:border-indigo-400"
                    }`}
                    aria-label={item.isPacked ? "Mark unpacked" : "Mark packed"}
                  >
                    {item.isPacked && (
                      <svg
                        className="h-3 w-3 text-white"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <path
                          d="M2 6l3 3 5-5"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>

                  {/* Name */}
                  <span
                    className={`flex-1 text-sm transition-colors ${
                      item.isPacked
                        ? "line-through text-zinc-400 dark:text-zinc-600"
                        : "text-zinc-800 dark:text-zinc-200"
                    }`}
                  >
                    {item.name}
                  </span>

                  {/* Quantity badge (only if >1) */}
                  {item.quantity > 1 && (
                    <span className="shrink-0 rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      ×{item.quantity}
                    </span>
                  )}

                  {/* Delete (hover reveal) — with inline confirmation */}
                  <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {deletingItemId === item.id ? (
                      <div className="flex items-center gap-1 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-2 py-0.5">
                        <AlertTriangle size={10} className="text-red-500 shrink-0" />
                        <button
                          onClick={() => handleDelete(item)}
                          className="text-[11px] font-semibold text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                        >
                          Yes
                        </button>
                        <span className="text-red-300 dark:text-red-800 text-[10px]">·</span>
                        <button
                          onClick={() => setDeletingItemId(null)}
                          className="text-[11px] text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingItemId(item.id)}
                        className="p-1 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/40 transition-all"
                        aria-label="Delete item"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Add item form */}
      <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-4">
        <form onSubmit={handleAdd} className="flex gap-2 flex-wrap sm:flex-nowrap">
          <input
            type="text"
            placeholder="Item name…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className={`${INPUT_CLASS} flex-1 min-w-0`}
            disabled={adding}
          />
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value as Category)}
            className={SELECT_CLASS}
            disabled={adding}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_EMOJI[cat]} {CATEGORY_LABEL[cat]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={adding || !newName.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 shrink-0"
          >
            <Plus size={15} />
            {adding ? "Adding…" : "Add"}
          </button>
        </form>
      </div>
    </div>
  );
}
