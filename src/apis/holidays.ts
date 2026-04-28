const BASE_URL = "https://date.nager.at/api/v3";

export type Country = {
  countryCode: string;
  name: string;
};

export type PublicHoliday = {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  fixed: boolean;
  global: boolean;
  counties: string[] | null;
  launchYear: number | null;
  types: string[];
};

export async function fetchAvailableCountries(): Promise<Country[]> {
  const res = await fetch(`${BASE_URL}/AvailableCountries`);
  if (!res.ok) throw new Error(`Failed to fetch countries: ${res.statusText}`);
  return res.json() as Promise<Country[]>;
}

export async function fetchPublicHolidays(countryCode: string, year: number): Promise<PublicHoliday[]> {
  const res = await fetch(`${BASE_URL}/PublicHolidays/${year}/${countryCode.toUpperCase()}`);
  if (!res.ok) throw new Error(`Failed to fetch holidays for ${countryCode} ${year}: ${res.statusText}`);
  return res.json() as Promise<PublicHoliday[]>;
}

export function formatHolidays(holidays: PublicHoliday[]): string {
  if (!holidays.length) return "No public holidays found.";
  return holidays
    .map((h) => {
      const scope = h.global ? "National" : `Regional (${h.counties?.join(", ")})`;
      return `${h.date}  ${h.name} (${h.localName})  [${scope}]`;
    })
    .join("\n");
}

export function formatCountries(countries: Country[]): string {
  return countries.map((c) => `${c.countryCode}  ${c.name}`).join("\n");
}
