import { McpServer } from "@modelcontextprotocol/server";
import { getWeather, getWeatherInputSchema } from "./apis/weather.js";
import { convertCurrency, convertCurrencyInputSchema } from "./apis/currency.js";
import { findMeals, findMealsInputSchema } from "./apis/meals.js";

export function registerTools(server: McpServer) {
  server.registerTool(
    "get_weather",
    {
      title: "Get Weather",
      description:
        "Get current weather conditions for a city or coordinates using the Open-Meteo API. " +
        "Provide either a city name or explicit latitude/longitude.",
      inputSchema: getWeatherInputSchema,
    },
    getWeather,
  );

  server.registerTool(
    "convert_currency",
    {
      title: "Convert Currency",
      description:
        "Convert an amount from one currency to another using live exchange rates from Frankfurter. " +
        "Use ISO 4217 currency codes (e.g. EUR, USD, GBP).",
      inputSchema: convertCurrencyInputSchema,
    },
    convertCurrency,
  );

  server.registerTool(
    "find_meals",
    {
      title: "Find Meals",
      description:
        "Search for meals using TheMealDB. Filter by name, category (e.g. 'Seafood'), " +
        "cuisine area (e.g. 'Italian'), or main ingredient (e.g. 'chicken_breast'). " +
        "Returns up to 5 results with ingredients and details.",
      inputSchema: findMealsInputSchema,
    },
    findMeals,
  );
}
