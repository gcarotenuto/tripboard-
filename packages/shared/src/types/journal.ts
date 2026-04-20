export interface JournalEntry {
  id: string;
  userId: string;
  tripId: string;
  title: string | null;
  content: string;
  mood: string | null;
  weather: string | null;
  locationName: string | null;
  locationLat: number | null;
  locationLng: number | null;
  mediaUrls: string[];
  entryDate: string;
  aiDraft: string | null;
  isAiDraft: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJournalEntryInput {
  title?: string;
  content: string;
  mood?: string;
  weather?: string;
  locationName?: string;
  locationLat?: number;
  locationLng?: number;
  mediaUrls?: string[];
  entryDate: string;
}

export const MOOD_OPTIONS = [
  { emoji: "😍", label: "Amazed" },
  { emoji: "😄", label: "Happy" },
  { emoji: "😊", label: "Content" },
  { emoji: "😐", label: "Neutral" },
  { emoji: "😔", label: "Tired" },
  { emoji: "😤", label: "Frustrated" },
  { emoji: "🤩", label: "Excited" },
  { emoji: "😌", label: "Peaceful" },
  { emoji: "🥵", label: "Exhausted" },
  { emoji: "🤒", label: "Unwell" },
] as const;

export const WEATHER_OPTIONS = [
  { emoji: "☀️", label: "Sunny" },
  { emoji: "⛅", label: "Partly Cloudy" },
  { emoji: "☁️", label: "Cloudy" },
  { emoji: "🌧️", label: "Rainy" },
  { emoji: "⛈️", label: "Stormy" },
  { emoji: "❄️", label: "Snowy" },
  { emoji: "💨", label: "Windy" },
  { emoji: "🌫️", label: "Foggy" },
  { emoji: "🌈", label: "Rainbow" },
] as const;
