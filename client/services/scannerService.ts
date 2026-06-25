import { ExpenseCategory } from "@/types";

export type ScannedBill = {
  totalAmount: number;
  date: string;
  merchantName: string;
  category: ExpenseCategory;
  description: string;
  fingerprint: string;
};

export async function mockScanBill(source: "camera" | "gallery"): Promise<ScannedBill> {
  const merchantName = source === "camera" ? "DMart" : "Cafe Green";
  const totalAmount = source === "camera" ? 880 : 1240;
  const category = source === "camera" ? "Grocery" : "Food";

  return {
    totalAmount,
    date: new Date().toISOString(),
    merchantName,
    category,
    description: merchantName === "DMart" ? "DMart Shopping" : "Restaurant bill",
    fingerprint: `${merchantName.toLowerCase()}-${new Date().toISOString().slice(0, 10)}-${totalAmount}`
  };
}
