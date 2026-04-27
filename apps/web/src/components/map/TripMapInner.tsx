"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import useSWR from "swr";
import { useEffect } from "react";

// Fix Leaflet default icon paths (broken by webpack asset hashing)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const EVENT_EMOJI: Record<string, string> = {
  FLIGHT: "✈️",
  TRAIN: "🚄",
  HOTEL: "🏨",
  ACTIVITY: "🎯",
  FOOD: "🍽️",
  TOUR: "🗺️",
  OTHER: "📌",
};

interface TripEvent {
  id: string;
  title: string;
  type: string;
  startsAt: string | null;
  locationName: string | null;
  locationLat: number | null;
  locationLng: number | null;
}

const fetcher = (url: string) =>
  fetch(url)
    .then((r) => r.json())
    .then((r) => r.data);

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 0) return;
    if (positions.length === 1) {
      map.setView(positions[0], 12);
    } else {
      map.fitBounds(positions, { padding: [40, 40] });
    }
  }, [map, positions]);
  return null;
}

export default function TripMapInner({ tripId }: { tripId: string }) {
  const { data: events, isLoading } = useSWR<TripEvent[]>(
    `/api/trips/${tripId}/events`,
    fetcher
  );

  const mapped = (events ?? []).filter(
    (e) => e.locationLat != null && e.locationLng != null
  );

  const positions: [number, number][] = mapped.map((e) => [
    e.locationLat as number,
    e.locationLng as number,
  ]);

  if (isLoading) {
    return (
      <div className="h-[400px] w-full rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
        <p className="text-sm text-zinc-400 dark:text-zinc-500">Loading map…</p>
      </div>
    );
  }

  if (mapped.length === 0) {
    return (
      <div className="h-[400px] w-full rounded-xl overflow-hidden bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 flex flex-col items-center justify-center gap-4 p-8">
        <span className="text-5xl">🗺️</span>
        <div className="text-center space-y-1.5 max-w-xs">
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">No locations on the map yet</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Import bookings from the{" "}
            <span className="font-medium text-indigo-600 dark:text-indigo-400">Document Vault</span>
            {" "}— TripBoard automatically extracts locations and pins them here.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {["✈️ Flights", "🏨 Hotels", "🚂 Trains", "🎯 Activities"].map((tag) => (
            <span key={tag} className="inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1 text-xs text-zinc-500 dark:text-zinc-400">
              {tag}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // Default center (first event); FitBounds will correct it
  const defaultCenter: [number, number] = positions[0];

  return (
    <div className="h-[400px] w-full rounded-xl overflow-hidden">
      <MapContainer
        center={defaultCenter}
        zoom={6}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds positions={positions} />
        {mapped.map((event) => (
          <Marker
            key={event.id}
            position={[event.locationLat as number, event.locationLng as number]}
          >
            <Popup>
              <div className="text-sm space-y-0.5">
                <p className="font-semibold leading-tight">
                  {EVENT_EMOJI[event.type] ?? "📌"} {event.title}
                </p>
                {event.startsAt && (
                  <p className="text-zinc-500 text-xs">
                    {new Date(event.startsAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                )}
                {event.locationName && (
                  <p className="text-zinc-500 text-xs">{event.locationName}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
