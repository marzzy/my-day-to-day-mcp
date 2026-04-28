import { z } from "zod";

const BASE_URL = "https://api.frankfurter.dev/v2";

export const convertCurrencyInputSchema = z.object({
  amount: z.number().positive().describe("Amount to convert"),
  from: z.string().length(3).toUpperCase().describe("Source currency code (e.g. 'EUR')"),
  to: z.string().length(3).toUpperCase().describe("Target currency code (e.g. 'USD')"),
});

type RateResponse = {
  date: string;
  base: string;
  quote: string;
  rate: number;
};

export async function convertCurrency({ amount, from, to }: z.infer<typeof convertCurrencyInputSchema>) {
  const res = await fetch(`${BASE_URL}/rate/${from.toUpperCase()}/${to.toUpperCase()}`);
  if (!res.ok) throw new Error(`Failed to fetch rate for ${from}/${to}: ${res.statusText}`);
  const data = await res.json() as RateResponse;
  const converted = amount * data.rate;

  const text = [
    `${amount} ${data.base} = ${converted.toFixed(2)} ${data.quote}`,
    `Rate: 1 ${data.base} = ${data.rate} ${data.quote}`,
    `Date: ${data.date}`,
  ].join("\n");

  return { content: [{ type: "text" as const, text }] };
}
