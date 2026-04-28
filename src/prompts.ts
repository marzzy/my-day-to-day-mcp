import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";

export function registerPrompts(server: McpServer) {
  server.registerPrompt(
    "plan_weekend",
    {
      title: "Plan My Weekend",
      description:
        "Creates a personalised weekend plan by combining local weather, public holidays, " +
        "meal ideas, and optional currency info for trips abroad.",
      argsSchema: z.object({
        city: z.string().describe("City where the weekend will be spent (e.g. 'Amsterdam')"),
        country_code: z.string().length(2).toUpperCase().describe("ISO country code for public holidays (e.g. 'NL')"),
        cuisine: z.string().optional().describe("Preferred cuisine or ingredient for meal ideas (e.g. 'Italian', 'salmon')"),
        trip_currency: z.string().length(3).toUpperCase().optional().describe("Foreign currency if planning a trip (e.g. 'JPY'). Rates shown against EUR."),
      }),
    },
    ({ city, country_code, cuisine, trip_currency }) => {
      const year = new Date().getFullYear();
      const mealHint = cuisine
        ? `Search for meals using the find_meals tool with area="${cuisine}" or ingredient="${cuisine}".`
        : "Search for meals using the find_meals tool with category=\"Vegetarian\" for lighter weekend options.";

      const currencySection = trip_currency
        ? `- Use the convert_currency tool to show how much 100 EUR is worth in ${trip_currency} so the user knows their spending power.`
        : "";

      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `You are a helpful weekend planning assistant. Build a practical and enjoyable weekend plan for me by following these steps in order:

1. **Weather** – Call the get_weather tool for "${city}" and summarise the forecast. Flag any rain or extreme temperatures that should influence the plan.

2. **Public Holidays** – Read the resource holidays://${country_code}/${year} and check whether either Saturday or Sunday this weekend falls on a public holiday. Mention it if so (shops/services may be closed).

3. **Meal ideas** – ${mealHint} Pick two meals: one for a relaxed Saturday dinner and one for a quick Sunday lunch. Include the key ingredients.

4. **Budget / currency** ${trip_currency ? `– ${currencySection}` : "– Skip this step (no trip currency provided)."}

5. **Weekend plan** – Combine everything above into a friendly day-by-day summary:
   - Saturday: morning activity suggestion based on weather + Saturday dinner recipe
   - Sunday: morning/afternoon activity + Sunday lunch recipe + any holiday note

Keep the tone practical and concise. Use bullet points inside each day.`,
            },
          },
        ],
      };
    },
  );

  server.registerPrompt(
    "suggest_meal_plan",
    {
      title: "Suggest Meal Plan",
      description:
        "Generates a multi-day meal plan tailored to weather, cuisine preference, " +
        "dietary needs, and number of people. Uses find_meals and get_weather.",
      argsSchema: z.object({
        city: z.string().describe("City to base the weather context on (e.g. 'Berlin')"),
        days: z.number().int().min(1).max(7).default(3).describe("Number of days to plan meals for (1–7)"),
        cuisine: z.string().optional().describe("Preferred cuisine area or key ingredient (e.g. 'Italian', 'salmon')"),
        dietary: z.string().optional().describe("Dietary preference or restriction (e.g. 'vegetarian', 'gluten-free', 'high-protein')"),
        servings: z.number().int().min(1).max(20).default(2).describe("Number of people to cook for"),
      }),
    },
    ({ city, days, cuisine, dietary, servings }) => {
      const cuisineHint = cuisine
        ? `area="${cuisine}" or ingredient="${cuisine}"`
        : `category="Vegetarian"`;

      const dietaryNote = dietary
        ? `The user has the following dietary requirement: **${dietary}**. Filter or adapt any meal that does not fit.`
        : "No dietary restrictions.";

      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `You are a practical meal planning assistant. Create a ${days}-day meal plan for ${servings} person(s) by following these steps:

1. **Weather context** – Call get_weather for "${city}". Note the temperature and conditions — use this to bias meals:
   - Cold/rainy → warming, hearty dishes (stews, soups, roasts)
   - Hot/sunny → lighter, fresh dishes (salads, grilled food, cold sides)

2. **Find meals** – Call find_meals with ${cuisineHint} to get inspiration. Run a second find_meals call with a different filter (e.g. name or another category) so you have variety. Gather at least ${days * 2} candidate meals total.

3. **Dietary filter** – ${dietaryNote} Remove any meal that conflicts; swap it for the next best candidate from step 2.

4. **Build the plan** – Assign meals across ${days} day(s). Each day needs:
   - **Lunch** – quick and lighter
   - **Dinner** – the main meal of the day

   Vary proteins and cooking styles across the days. Do not repeat the same meal.

5. **Shopping summary** – After the plan, list all unique ingredients across all meals grouped by type (produce, protein, pantry). Scale quantities for ${servings} serving(s).

Format:
## Day 1 – [Weekday]
- **Lunch:** [Meal name] — key ingredients
- **Dinner:** [Meal name] — key ingredients

(repeat for each day)

## Shopping List
- Produce: ...
- Protein: ...
- Pantry: ...

Keep it concise and actionable.`,
            },
          },
        ],
      };
    },
  );

  server.registerPrompt(
    "plan_trip",
    {
      title: "Plan a Trip",
      description:
        "Creates a practical trip plan for a destination by combining weather, " +
        "local public holidays, currency exchange, and authentic local meal suggestions.",
      argsSchema: z.object({
        destination_city: z.string().describe("City you are travelling to (e.g. 'Tokyo')"),
        country_code: z.string().length(2).toUpperCase().describe("ISO country code of the destination (e.g. 'JP')"),
        home_currency: z.string().length(3).toUpperCase().describe("Your home currency to convert from (e.g. 'EUR')"),
        destination_currency: z.string().length(3).toUpperCase().describe("Local currency at the destination (e.g. 'JPY')"),
        days: z.number().int().min(1).max(14).default(3).describe("Length of the trip in days (1–14)"),
        budget_amount: z.number().positive().default(500).describe("Daily budget in your home currency to convert as a reference"),
      }),
    },
    ({ destination_city, country_code, home_currency, destination_currency, days, budget_amount }) => {
      const year = new Date().getFullYear();

      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `You are a savvy travel planning assistant. Plan a ${days}-day trip to ${destination_city} by working through these steps in order:

1. **Weather** – Call get_weather for "${destination_city}". Summarise the conditions and flag anything that affects packing (rain, heat, cold) or outdoor plans.

2. **Public holidays** – Read the resource holidays://${country_code}/${year}. Flag any public holidays falling during a typical ${days}-day trip window from today. Note which sites or services may be closed and which holidays are worth experiencing.

3. **Currency & budget** – Call convert_currency to convert ${budget_amount} ${home_currency} to ${destination_currency}. Present the result as a clear daily budget reference and add one practical money tip for the destination.

4. **Local food** – Call find_meals with area matching the cuisine of ${destination_city}'s country to surface authentic dishes. Pick 3–4 must-try meals and for each note: name, key ingredients, and whether it suits common dietary needs (meat / vegetarian / vegan friendly).

5. **Day-by-day itinerary** – Build a ${days}-day plan that weaves together the weather context, holiday awareness, and food suggestions:

   For each day use this format:
   ## Day [N] – [Suggested theme, e.g. "Arrival & neighbourhood explore"]
   - **Morning:** activity or arrival task
   - **Afternoon:** activity (weather-adjusted)
   - **Evening / Dinner:** recommend one of the local meals from step 4

6. **Packing checklist** – A short bullet list driven by the weather findings from step 1.

7. **Quick tips** – 3 practical tips specific to ${destination_city} (transport, etiquette, safety, or timing).

Keep the tone friendly and concrete. Avoid vague suggestions — give real neighbourhoods, dish names, and actionable advice.`,
            },
          },
        ],
      };
    },
  );
}
