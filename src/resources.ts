import { McpServer, ResourceTemplate } from "@modelcontextprotocol/server";
import {
  fetchAvailableCountries,
  fetchPublicHolidays,
  formatCountries,
  formatHolidays,
} from "./apis/holidays.js";

export function registerResources(server: McpServer) {
  server.registerResource(
    "holiday-countries",
    "holidays://countries",
    { title: "Available Holiday Countries", mimeType: "text/plain" },
    async (uri) => {
      const countries = await fetchAvailableCountries();
      return { contents: [{ uri: uri.href, text: formatCountries(countries) }] };
    },
  );

  // URI pattern: holidays://{countryCode}/{year}  e.g. holidays://DE/2026
  server.registerResource(
    "public-holidays",
    new ResourceTemplate("holidays://{countryCode}/{year}", { list: undefined }),
    { title: "Public Holidays", mimeType: "text/plain" },
    async (uri, { countryCode, year }) => {
      const holidays = await fetchPublicHolidays(String(countryCode), Number(year));
      return { contents: [{ uri: uri.href, text: formatHolidays(holidays) }] };
    },
  );
}
