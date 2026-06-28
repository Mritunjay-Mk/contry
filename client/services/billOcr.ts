import { ExpenseCategory } from "@/types";

// Expo inlines EXPO_PUBLIC_* values at build time; declare process for TypeScript.
declare const process: { env: Record<string, string | undefined> };

export type ExtractedItem = { name: string; amount: number };

export type ExtractedBill = {
  merchantName?: string;
  category?: ExpenseCategory;
  items: ExtractedItem[];
  total: number;
};

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";

const PROMPT =
  'Extract the line items and prices from this bill/receipt image. ' +
  'Return JSON ONLY (no markdown, no commentary) in exactly this shape: ' +
  '{ "merchantName": string, "category": string, "items": [{ "name": string, "amount": number }], "total": number }. ' +
  'category must be one of: Food, Grocery, Gas, Rent, Electricity, Internet, Travel, Other. ' +
  'amount and total are plain numbers without currency symbols. ' +
  'If a value is unreadable, make your best estimate.';

// Pull the JSON object out of the model response, tolerating ```json fences.
function parseBill(text: string): ExtractedBill | null {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) return null;

  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    const items: ExtractedItem[] = Array.isArray(parsed.items)
      ? parsed.items
          .map((item: any) => ({ name: String(item?.name ?? ""), amount: Number(item?.amount) || 0 }))
          .filter((item: ExtractedItem) => item.name)
      : [];
    const total =
      Number(parsed.total) || items.reduce((sum, item) => sum + item.amount, 0);

    return {
      merchantName: parsed.merchantName ? String(parsed.merchantName) : undefined,
      category: parsed.category ? (String(parsed.category) as ExpenseCategory) : undefined,
      items,
      total
    };
  } catch {
    return null;
  }
}

/**
 * Sends the captured bill image to Claude and returns the extracted items/total.
 * Throws a descriptive error when the API key is missing or the request fails,
 * and returns null only when the response could not be parsed into a bill.
 */
export async function extractBill(base64: string, mediaType: string): Promise<ExtractedBill | null> {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Add your Anthropic API key to a .env file as EXPO_PUBLIC_ANTHROPIC_API_KEY and restart Expo."
    );
  }

  const response = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      // Required for direct browser (web) calls to bypass CORS protection.
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
            { type: "text", text: PROMPT }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Claude request failed (${response.status}). ${detail.slice(0, 200)}`);
  }

  const json = await response.json();
  const text: string | undefined = json?.content?.find((block: any) => block.type === "text")?.text;
  if (!text) return null;
  return parseBill(text);
}
