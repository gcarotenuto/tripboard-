import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PrintActions } from "./PrintActions";

interface PrintPageProps {
  params: { id: string };
}

function formatDate(d: Date | string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

function groupByCategory<T extends { category: string }>(items: T[]): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});
}

export default async function PrintPage({ params }: PrintPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const userId = (session.user as { id: string }).id;

  const trip = await prisma.trip.findFirst({ where: { id: params.id, userId } });
  if (!trip) redirect("/trips");

  const [events, expenses, journal] = await Promise.all([
    prisma.tripEvent.findMany({
      where: { tripId: params.id },
      orderBy: { startsAt: "asc" },
    }),
    prisma.expense.findMany({
      where: { tripId: params.id },
      orderBy: { date: "asc" },
    }),
    prisma.journalEntry.findMany({
      where: { tripId: params.id, deletedAt: null },
      orderBy: { entryDate: "asc" },
    }),
  ]);

  const destinations: Array<{ city: string; country: string }> = JSON.parse(
    (trip.destinations as unknown as string) || "[]"
  );
  const destString =
    destinations.map((d) => `${d.city}, ${d.country}`).join(" · ") ||
    trip.primaryDestination ||
    "";

  const startStr = trip.startsAt ? formatDate(trip.startsAt) : null;
  const endStr = trip.endsAt ? formatDate(trip.endsAt) : null;
  const dateRange = startStr && endStr ? `${startStr} – ${endStr}` : startStr ?? "";

  const totalByCategory = groupByCategory(expenses);
  const grandTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const primaryCurrency = expenses[0]?.currency ?? "USD";

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { font-family: Georgia, serif; color: #000; background: #fff; }
          .print-page { padding: 0; margin: 0; }
          .section-break { page-break-before: always; }
          a { color: inherit; text-decoration: none; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ccc; padding: 6px 10px; }
          th { background: #f5f5f5; font-weight: bold; }
        }
        @media screen {
          body { background: #f4f4f5; }
          .print-page { max-width: 800px; margin: 0 auto; background: #fff; box-shadow: 0 4px 32px rgba(0,0,0,0.10); }
        }
      `}</style>

      <div className="print-page p-8 min-h-screen">
        {/* Actions bar — screen only */}
        <div className="no-print mb-8 flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-3">
          <p className="text-sm text-zinc-500">
            Print or save as PDF using your browser&apos;s print dialog.
          </p>
          <PrintActions tripId={trip.id} />
        </div>

        {/* Trip Header */}
        <header className="mb-8 border-b-2 border-zinc-900 pb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">{trip.title}</h1>
              {destString && (
                <p className="mt-1 text-base text-zinc-600">{destString}</p>
              )}
              {dateRange && (
                <p className="mt-0.5 text-sm text-zinc-500">{dateRange}</p>
              )}
              {trip.description && (
                <p className="mt-3 text-sm text-zinc-600 leading-relaxed">{trip.description}</p>
              )}
            </div>
            <div className="text-right text-xs text-zinc-400 shrink-0">
              <p>TripBoard Export</p>
              <p>{new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
            </div>
          </div>
        </header>

        {/* Itinerary */}
        {events.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-xl font-bold text-zinc-900 tracking-tight border-b border-zinc-200 pb-2">
              Itinerary
            </h2>
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex gap-4 rounded-lg border border-zinc-200 p-3"
                >
                  <div className="w-32 shrink-0 text-xs text-zinc-500">
                    {event.startsAt ? formatDate(event.startsAt) : "TBD"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-zinc-900">{event.title}</p>
                    <p className="text-xs text-zinc-500 capitalize">{event.type.toLowerCase()}</p>
                    {event.locationName && (
                      <p className="text-xs text-zinc-400 mt-0.5">{event.locationName}</p>
                    )}
                    {event.notes && (
                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{event.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Expenses */}
        {expenses.length > 0 && (
          <section className="mb-10 section-break">
            <h2 className="mb-4 text-xl font-bold text-zinc-900 tracking-tight border-b border-zinc-200 pb-2">
              Expenses
            </h2>

            <table className="w-full text-sm border border-zinc-200 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-zinc-50 text-left">
                  <th className="px-3 py-2 font-semibold text-zinc-700 border-b border-zinc-200">Date</th>
                  <th className="px-3 py-2 font-semibold text-zinc-700 border-b border-zinc-200">Description</th>
                  <th className="px-3 py-2 font-semibold text-zinc-700 border-b border-zinc-200">Category</th>
                  <th className="px-3 py-2 font-semibold text-zinc-700 border-b border-zinc-200 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-zinc-100 last:border-0">
                    <td className="px-3 py-2 text-xs text-zinc-500 whitespace-nowrap">
                      {formatDate(expense.date)}
                    </td>
                    <td className="px-3 py-2 text-zinc-900">{expense.title}</td>
                    <td className="px-3 py-2 text-xs text-zinc-500 capitalize">
                      {expense.category.toLowerCase().replace(/_/g, " ")}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-zinc-900 whitespace-nowrap">
                      {formatCurrency(expense.amount, expense.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals by category */}
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Object.entries(totalByCategory).map(([cat, items]) => {
                const catTotal = items.reduce((s, e) => s + e.amount, 0);
                return (
                  <div key={cat} className="rounded-lg border border-zinc-200 px-3 py-2">
                    <p className="text-xs text-zinc-500 capitalize">{cat.toLowerCase().replace(/_/g, " ")}</p>
                    <p className="font-semibold text-zinc-900">
                      {formatCurrency(catTotal, items[0].currency)}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex justify-end">
              <div className="rounded-lg border-2 border-zinc-900 px-4 py-2 text-right">
                <p className="text-xs text-zinc-500 uppercase tracking-wider">Grand Total</p>
                <p className="text-lg font-bold text-zinc-900">
                  {formatCurrency(grandTotal, primaryCurrency)}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Journal */}
        {journal.length > 0 && (
          <section className="mb-10 section-break">
            <h2 className="mb-4 text-xl font-bold text-zinc-900 tracking-tight border-b border-zinc-200 pb-2">
              Journal
            </h2>
            <div className="space-y-6">
              {journal.map((entry) => (
                <div key={entry.id} className="border-l-4 border-zinc-200 pl-4">
                  <div className="mb-1 flex items-baseline gap-3">
                    <p className="font-semibold text-zinc-900">
                      {entry.title ?? "Untitled Entry"}
                    </p>
                    <span className="text-xs text-zinc-400">{formatDate(entry.entryDate)}</span>
                  </div>
                  {entry.locationName && (
                    <p className="text-xs text-zinc-400 mb-1">{entry.locationName}</p>
                  )}
                  <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
                    {entry.content}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="mt-12 border-t border-zinc-200 pt-4 text-center text-xs text-zinc-400">
          Generated by TripBoard · {trip.title}
        </footer>
      </div>
    </>
  );
}
