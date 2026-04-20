export type DocumentType =
  | "BOOKING_CONFIRMATION"
  | "FLIGHT_TICKET"
  | "BOARDING_PASS"
  | "HOTEL_VOUCHER"
  | "CAR_RENTAL_VOUCHER"
  | "TRAIN_TICKET"
  | "TOUR_VOUCHER"
  | "VISA"
  | "PASSPORT"
  | "INSURANCE"
  | "TRAVEL_ADVISORY"
  | "HEALTH_CERTIFICATE"
  | "RECEIPT"
  | "ITINERARY"
  | "MAP"
  | "OTHER";

export type DocumentStatus = "PENDING" | "PROCESSING" | "EXTRACTED" | "REVIEWED" | "FAILED";
export type DocumentSource = "EMAIL_FORWARD" | "EMAIL_CONNECTOR" | "PDF_UPLOAD" | "IMAGE_UPLOAD" | "ICS_IMPORT" | "MANUAL" | "API";

export interface Document {
  id: string;
  userId: string;
  tripId: string | null;
  filename: string;
  mimeType: string;
  fileSize: number;
  storageKey: string;
  type: DocumentType;
  status: DocumentStatus;
  source: DocumentSource;
  rawText: string | null;
  extractedData: Record<string, unknown> | null;
  extractionModel: string | null;
  extractionConfidence: number | null;
  notes: string | null;
  tags: string[];
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentUploadInput {
  tripId?: string;
  source: DocumentSource;
  filename: string;
  mimeType: string;
  fileSize: number;
  tags?: string[];
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  BOOKING_CONFIRMATION: "Booking Confirmation",
  FLIGHT_TICKET: "Flight Ticket",
  BOARDING_PASS: "Boarding Pass",
  HOTEL_VOUCHER: "Hotel Voucher",
  CAR_RENTAL_VOUCHER: "Car Rental Voucher",
  TRAIN_TICKET: "Train Ticket",
  TOUR_VOUCHER: "Tour Voucher",
  VISA: "Visa",
  PASSPORT: "Passport",
  INSURANCE: "Insurance",
  TRAVEL_ADVISORY: "Travel Advisory",
  HEALTH_CERTIFICATE: "Health Certificate",
  RECEIPT: "Receipt",
  ITINERARY: "Itinerary",
  MAP: "Map",
  OTHER: "Other",
};

export const DOCUMENT_TYPE_EMOJIS: Record<DocumentType, string> = {
  BOOKING_CONFIRMATION: "🎫",
  FLIGHT_TICKET: "✈️",
  BOARDING_PASS: "🎟️",
  HOTEL_VOUCHER: "🏨",
  CAR_RENTAL_VOUCHER: "🚗",
  TRAIN_TICKET: "🚄",
  TOUR_VOUCHER: "🗺️",
  VISA: "🛂",
  PASSPORT: "📘",
  INSURANCE: "🛡️",
  TRAVEL_ADVISORY: "⚠️",
  HEALTH_CERTIFICATE: "💉",
  RECEIPT: "🧾",
  ITINERARY: "📋",
  MAP: "🗾",
  OTHER: "📄",
};

export const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "text/calendar",
  "message/rfc822",
  "text/plain",
];

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
