import {
  Bolt,
  Car,
  CircleEllipsis,
  Fuel,
  Home,
  Plane,
  ShoppingBasket,
  Utensils
} from "lucide-react-native";

import { ExpenseCategory } from "@/types";

export const CATEGORIES: ExpenseCategory[] = [
  "Food",
  "Grocery",
  "Gas",
  "Rent",
  "Electricity",
  "Internet",
  "Travel",
  "Other"
];

export const CATEGORY_META = {
  Food: { color: "#F97316", icon: Utensils },
  Grocery: { color: "#22C55E", icon: ShoppingBasket },
  Gas: { color: "#0EA5E9", icon: Fuel },
  Rent: { color: "#8B5CF6", icon: Home },
  Electricity: { color: "#EAB308", icon: Bolt },
  Internet: { color: "#06B6D4", icon: Plane },
  Travel: { color: "#EF4444", icon: Car },
  Other: { color: "#64748B", icon: CircleEllipsis }
} satisfies Record<ExpenseCategory, { color: string; icon: typeof Utensils }>;
