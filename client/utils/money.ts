import { CurrencyCode } from "@/types";

const SYMBOLS: Record<CurrencyCode, string> = {
  INR: "\u20B9",
  USD: "$",
  EUR: "\u20AC",
  GBP: "\u00A3"
};

export function formatMoney(amount: number, currency: CurrencyCode = "INR") {
  const abs = Math.abs(amount);
  return `${amount < 0 ? "-" : ""}${SYMBOLS[currency]}${abs.toLocaleString("en-IN", {
    maximumFractionDigits: 0
  })}`;
}

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
