export interface UserPreferences {
  theme: "light" | "dark" | "system";
  currency: string;
  timezone: string;
  language: string;
  defaultView: "logistics" | "moments";
  weekStartsOn: 0 | 1; // 0 = Sunday, 1 = Monday
  distanceUnit: "km" | "mi";
}

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  preferences: UserPreferences;
  createdAt: string;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "system",
  currency: "USD",
  timezone: "UTC",
  language: "en",
  defaultView: "logistics",
  weekStartsOn: 1,
  distanceUnit: "km",
};
