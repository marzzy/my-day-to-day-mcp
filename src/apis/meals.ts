import { z } from "zod";

const BASE_URL = "https://www.themealdb.com/api/json/v1/1";

export const findMealsInputSchema = z.object({
  name: z.string().optional().describe("Search by meal name (e.g. 'chicken')"),
  category: z.string().optional().describe("Filter by category (e.g. 'Seafood', 'Vegetarian')"),
  area: z.string().optional().describe("Filter by cuisine area (e.g. 'Italian', 'Japanese')"),
  ingredient: z.string().optional().describe("Filter by a main ingredient (e.g. 'chicken_breast')"),
}).refine(
  (d) => Object.values(d).some((v) => v !== undefined),
  { message: "Provide at least one of: name, category, area, ingredient" },
);

type Meal = Record<string, string | null>;
type MealApiResponse = { meals: Meal[] | null };

type MealSummary = {
  id: string;
  name: string;
  category: string;
  area: string;
  tags: string;
  thumbnail: string;
  ingredients: string[];
};

function parseMeal(m: Meal): MealSummary {
  const ingredients: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = m[`strIngredient${i}`]?.trim();
    const measure = m[`strMeasure${i}`]?.trim();
    if (ingredient) ingredients.push(measure ? `${measure} ${ingredient}` : ingredient);
  }
  return {
    id: m["idMeal"] ?? "",
    name: m["strMeal"] ?? "",
    category: m["strCategory"] ?? "",
    area: m["strArea"] ?? "",
    tags: m["strTags"] ?? "",
    thumbnail: m["strMealThumb"] ?? "",
    ingredients,
  };
}

function formatMeals(meals: MealSummary[]): string {
  return meals
    .map((m) => {
      const lines = [
        `${m.name} (${m.area} ${m.category})`,
        `ID: ${m.id}`,
      ];
      if (m.tags) lines.push(`Tags: ${m.tags}`);
      lines.push(`Ingredients: ${m.ingredients.join(", ")}`);
      if (m.thumbnail) lines.push(`Thumbnail: ${m.thumbnail}`);
      return lines.join("\n");
    })
    .join("\n\n");
}

async function getMealsByFilter(param: string, value: string): Promise<MealSummary[]> {
  const res = await fetch(`${BASE_URL}/filter.php?${param}=${encodeURIComponent(value)}`);
  if (!res.ok) throw new Error(`MealDB filter request failed: ${res.statusText}`);
  const data = await res.json() as MealApiResponse;
  if (!data.meals) return [];

  // Filter results only return partial data — fetch full details for first 5 matches
  const details = await Promise.all(
    data.meals.slice(0, 5).map(async (m) => {
      const detailRes = await fetch(`${BASE_URL}/lookup.php?i=${m["idMeal"]}`);
      const detailData = await detailRes.json() as MealApiResponse;
      return detailData.meals?.[0];
    }),
  );
  return details.filter((m): m is Meal => m !== undefined).map(parseMeal);
}

export async function findMeals({ name, category, area, ingredient }: z.infer<typeof findMealsInputSchema>) {
  let meals: MealSummary[] = [];

  if (name) {
    const res = await fetch(`${BASE_URL}/search.php?s=${encodeURIComponent(name)}`);
    if (!res.ok) throw new Error(`MealDB search request failed: ${res.statusText}`);
    const data = await res.json() as MealApiResponse;
    meals = (data.meals ?? []).slice(0, 5).map(parseMeal);
  } else if (category) {
    meals = await getMealsByFilter("c", category);
  } else if (area) {
    meals = await getMealsByFilter("a", area);
  } else if (ingredient) {
    meals = await getMealsByFilter("i", ingredient);
  }

  if (!meals.length) {
    return { content: [{ type: "text" as const, text: "No meals found for the given search criteria." }] };
  }

  const text = `Found ${meals.length} meal(s):\n\n${formatMeals(meals)}`;
  return { content: [{ type: "text" as const, text }] };
}
