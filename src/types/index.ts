import { NavigatorScreenParams } from "@react-navigation/native";

export type ExpenseCategory =
  | "Food"
  | "Grocery"
  | "Gas"
  | "Rent"
  | "Electricity"
  | "Internet"
  | "Travel"
  | "Other";

export type Group = {
  id: string;
  name: string;
  createdAt: string;
};

export type Member = {
  id: string;
  groupId: string;
  name: string;
};

export type Expense = {
  id: string;
  groupId: string;
  amount: number;
  paidBy: string;
  category: ExpenseCategory;
  description: string;
  date: string;
  merchantName?: string;
  billFingerprint?: string;
};

export type Settlement = {
  id: string;
  groupId: string;
  fromMember: string;
  toMember: string;
  amount: number;
  status: "pending" | "settled";
};

export type Balance = {
  memberId: string;
  paid: number;
  share: number;
  balance: number;
};

export type CurrencyCode = "INR" | "USD" | "EUR" | "GBP";

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  GroupEditor: { groupId?: string } | undefined;
  MemberEditor: { memberId?: string } | undefined;
  ExpenseEditor: { expenseId?: string; scannedExpense?: Partial<Expense> } | undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Groups: undefined;
  History: undefined;
  Settlements: undefined;
  Reports: undefined;
  Scanner: undefined;
  Settings: undefined;
};
