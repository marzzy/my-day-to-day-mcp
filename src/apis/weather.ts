import { z } from "zod";

const WMO_CODES: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Icy fog",
  51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
  61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
  71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
  80: "Slight showers", 81: "Moderate showers", 82: "Violent showers",
  95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Thunderstorm with heavy hail",
};

type GeoResult = { latitude: number; longitude: number; name: string; country: string };
type WeatherResponse = {
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    cloud_cover: number;
  };
  current_units: Record<string, string>;
};

export const getWeatherInputSchema = z.object({
  city: z.string().optional().describe("City name to look up (e.g. 'Berlin', 'Amsterdam')"),
  latitude: z.number().min(-90).max(90).optional().describe("Latitude (-90 to 90)"),
  longitude: z.number().min(-180).max(180).optional().describe("Longitude (-180 to 180)"),
}).refine(
  (d) => d.city !== undefined || (d.latitude !== undefined && d.longitude !== undefined),
  { message: "Provide either 'city' or both 'latitude' and 'longitude'" },
);

export async function getWeather({ city, latitude, longitude }: z.infer<typeof getWeatherInputSchema>) {
  let lat = latitude;
  let lon = longitude;
  let resolvedName = city;

  if (city) {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
    const geoRes = await fetch(geoUrl);
    if (!geoRes.ok) throw new Error(`Geocoding request failed: ${geoRes.statusText}`);
    const geoData = await geoRes.json() as { results?: GeoResult[] };
    const place = geoData.results?.[0];
    if (!place) throw new Error(`City not found: ${city}`);
    lat = place.latitude;
    lon = place.longitude;
    resolvedName = `${place.name}, ${place.country}`;
  }

  const vars = "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,cloud_cover";
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=${vars}&wind_speed_unit=ms`;
  const weatherRes = await fetch(weatherUrl);
  if (!weatherRes.ok) throw new Error(`Weather request failed: ${weatherRes.statusText}`);
  const data = await weatherRes.json() as WeatherResponse;

  const c = data.current;
  const u = data.current_units;
  const condition = WMO_CODES[c.weather_code] ?? `Code ${c.weather_code}`;

  const summary = [
    `Weather for ${resolvedName ?? `${lat}, ${lon}`} at ${c.time}`,
    `Condition: ${condition}`,
    `Temperature: ${c.temperature_2m}${u.temperature_2m} (feels like ${c.apparent_temperature}${u.apparent_temperature})`,
    `Humidity: ${c.relative_humidity_2m}${u.relative_humidity_2m}`,
    `Precipitation: ${c.precipitation}${u.precipitation}`,
    `Wind: ${c.wind_speed_10m}${u.wind_speed_10m} at ${c.wind_direction_10m}${u.wind_direction_10m}`,
    `Cloud cover: ${c.cloud_cover}${u.cloud_cover}`,
  ].join("\n");

  return { content: [{ type: "text" as const, text: summary }] };
}
