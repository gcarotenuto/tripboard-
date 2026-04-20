export type TripStatus = "PLANNING" | "UPCOMING" | "ACTIVE" | "COMPLETED" | "ARCHIVED";

export interface TripDestination {
  city: string;
  country: string;
  lat?: number;
  lng?: number;
}

export interface MemoryCapsuleStats {
  totalDays: number;
  citiesVisited: number;
  totalExpenses: number;
  currency: string;
  photosCaptures?: number;
  journalEntries: number;
}

export interface MemoryCapsule {
  summary: string;
  highlights: string[];
  stats: MemoryCapsuleStats;
  generatedAt: string;
}

export interface Trip {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: TripStatus;
  coverImageUrl: string | null;
  startsAt: string | null;
  endsAt: string | null;
  timezone: string;
  primaryDestination: string | null;
  destinations: TripDestination[];
  tags: string[];
  isArchived: boolean;
  archivedAt: string | null;
  memoryCapsule: MemoryCapsule | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTripInput {
  title: string;
  description?: string;
  startsAt?: string;
  endsAt?: string;
  timezone?: string;
  primaryDestination?: string;
  destinations?: TripDestination[];
  tags?: string[];
}

export interface UpdateTripInput extends Partial<CreateTripInput> {
  status?: TripStatus;
  coverImageUrl?: string;
  isArchived?: boolean;
}

export interface TripSummary {
  id: string;
  title: string;
  status: TripStatus;
  primaryDestination: string | null;
  startsAt: string | null;
  endsAt: string | null;
  coverImageUrl: string | null;
  tags: string[];
  eventCount?: number;
  documentCount?: number;
  expenseTotal?: number;
}
