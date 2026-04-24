"use client";

import dynamic from "next/dynamic";

const TripMapInner = dynamic(() => import("./TripMapInner"), { ssr: false });

interface TripMapProps {
  tripId: string;
}

export function TripMap({ tripId }: TripMapProps) {
  return <TripMapInner tripId={tripId} />;
}
