import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// WMO Weather Code → emoji + description
function decodeWeatherCode(code: number): { emoji: string; description: string } {
  if (code === 0) return { emoji: "☀️", description: "Clear sky" };
  if (code <= 3) return { emoji: "🌤️", description: "Partly cloudy" };
  if (code === 45 || code === 48) return { emoji: "🌫️", description: "Foggy" };
  if (code >= 51 && code <= 55) return { emoji: "🌦️", description: "Drizzle" };
  if (code >= 61 && code <= 65) return { emoji: "🌧️", description: "Rain" };
  if (code >= 71 && code <= 75) return { emoji: "❄️", description: "Snow" };
  if (code >= 80 && code <= 82) return { emoji: "🌧️", description: "Showers" };
  if (code === 95) return { emoji: "⛈️", description: "Thunderstorm" };
  return { emoji: "🌡️", description: "Unknown" };
}

export async function GET(_req: Request, { params }: { params: { tripId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const trip = await prisma.trip.findFirst({
    where: { id: params.tripId, userId, deletedAt: null },
    select: { primaryDestination: true, startsAt: true, endsAt: true },
  });

  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!trip.primaryDestination) return NextResponse.json({ data: null });

  // Extract the first city name from the destination string
  const cityName = trip.primaryDestination.split(",")[0].trim();

  // Step 1: Geocode
  const geoRes = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`
  );

  if (!geoRes.ok) {
    return NextResponse.json({ error: "Geocoding failed" }, { status: 502 });
  }

  const geoData = await geoRes.json();
  const location = geoData.results?.[0];

  if (!location) {
    return NextResponse.json({ data: null });
  }

  const { latitude, longitude, name: city } = location;

  // Step 2: Fetch forecast (always 7 days ahead)
  const forecastRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=auto&forecast_days=7`
  );

  if (!forecastRes.ok) {
    return NextResponse.json({ error: "Forecast fetch failed" }, { status: 502 });
  }

  const forecastData = await forecastRes.json();
  const daily = forecastData.daily;

  if (!daily) {
    return NextResponse.json({ data: null });
  }

  const days = (daily.time as string[]).map((date: string, i: number) => {
    const code: number = daily.weathercode[i] ?? 0;
    const { emoji, description } = decodeWeatherCode(code);
    return {
      date,
      maxTemp: Math.round(daily.temperature_2m_max[i] ?? 0),
      minTemp: Math.round(daily.temperature_2m_min[i] ?? 0),
      precipitation: Math.round((daily.precipitation_sum[i] ?? 0) * 10) / 10,
      code,
      description,
      emoji,
    };
  });

  return NextResponse.json({ data: { city, days } });
}
