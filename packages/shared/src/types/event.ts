export type EventType =
  | "FLIGHT"
  | "TRAIN"
  | "BUS"
  | "CAR_RENTAL"
  | "FERRY"
  | "HOTEL"
  | "ACCOMMODATION"
  | "RESTAURANT"
  | "ACTIVITY"
  | "TOUR"
  | "TRANSFER"
  | "MOMENT"
  | "PHOTO"
  | "NOTE"
  | "VISA"
  | "INSURANCE"
  | "HEALTH"
  | "OTHER";

export type EventView = "LOGISTICS" | "MOMENTS" | "BOTH";

export interface FlightDetails {
  flightNumber: string;
  airline: string;
  departureAirport: string;
  arrivalAirport: string;
  departureTerminal?: string;
  arrivalTerminal?: string;
  bookingRef?: string;
  seat?: string;
  class?: string;
  duration?: string;
}

export interface HotelDetails {
  confirmationNumber: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  roomType?: string;
  breakfastIncluded?: boolean;
  totalCost?: number;
  currency?: string;
}

export interface TrainDetails {
  trainNumber: string;
  operator: string;
  departureStation: string;
  arrivalStation: string;
  carriage?: string;
  seat?: string;
  reservationNumber?: string;
}

export type EventDetails = FlightDetails | HotelDetails | TrainDetails | Record<string, unknown>;

export interface TripEvent {
  id: string;
  tripId: string;
  title: string;
  type: EventType;
  view: EventView;
  startsAt: string | null;
  endsAt: string | null;
  timezone: string | null;
  allDay: boolean;
  locationName: string | null;
  locationAddress: string | null;
  locationLat: number | null;
  locationLng: number | null;
  locationPlaceId: string | null;
  details: EventDetails;
  sourceDocumentId: string | null;
  sourceType: string | null;
  confidence: number | null;
  isDuplicate: boolean;
  duplicateOfId: string | null;
  notes: string | null;
  emoji: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventInput {
  title: string;
  type: EventType;
  view?: EventView;
  startsAt?: string;
  endsAt?: string;
  timezone?: string;
  allDay?: boolean;
  locationName?: string;
  locationAddress?: string;
  locationLat?: number;
  locationLng?: number;
  details?: EventDetails;
  notes?: string;
  emoji?: string;
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  FLIGHT: "Flight",
  TRAIN: "Train",
  BUS: "Bus",
  CAR_RENTAL: "Car Rental",
  FERRY: "Ferry",
  HOTEL: "Hotel",
  ACCOMMODATION: "Accommodation",
  RESTAURANT: "Restaurant",
  ACTIVITY: "Activity",
  TOUR: "Tour",
  TRANSFER: "Transfer",
  MOMENT: "Moment",
  PHOTO: "Photo",
  NOTE: "Note",
  VISA: "Visa",
  INSURANCE: "Insurance",
  HEALTH: "Health",
  OTHER: "Other",
};

export const EVENT_TYPE_EMOJIS: Record<EventType, string> = {
  FLIGHT: "✈️",
  TRAIN: "🚄",
  BUS: "🚌",
  CAR_RENTAL: "🚗",
  FERRY: "⛴️",
  HOTEL: "🏨",
  ACCOMMODATION: "🏠",
  RESTAURANT: "🍽️",
  ACTIVITY: "🎯",
  TOUR: "🗺️",
  TRANSFER: "🚕",
  MOMENT: "✨",
  PHOTO: "📸",
  NOTE: "📝",
  VISA: "🛂",
  INSURANCE: "🛡️",
  HEALTH: "💊",
  OTHER: "📌",
};

export const LOGISTICS_EVENT_TYPES: EventType[] = [
  "FLIGHT", "TRAIN", "BUS", "CAR_RENTAL", "FERRY",
  "HOTEL", "ACCOMMODATION", "TRANSFER",
  "VISA", "INSURANCE", "HEALTH",
];

export const MOMENTS_EVENT_TYPES: EventType[] = [
  "RESTAURANT", "ACTIVITY", "TOUR",
  "MOMENT", "PHOTO", "NOTE", "OTHER",
];
