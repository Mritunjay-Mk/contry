import { Expense, Group, Member } from "@/types";

export const sampleGroups: Group[] = [
  { id: "group-flat", name: "Flat Expenses", createdAt: "2026-06-01T10:00:00.000Z" },
  { id: "group-goa", name: "Goa Trip", createdAt: "2026-06-04T10:00:00.000Z" },
  { id: "group-office", name: "Office Lunch", createdAt: "2026-06-08T10:00:00.000Z" },
  { id: "group-cricket", name: "Cricket Team", createdAt: "2026-06-12T10:00:00.000Z" }
];

export const sampleMembers: Member[] = [
  { id: "member-ritik", groupId: "group-flat", name: "Ritik" },
  { id: "member-mritunjay", groupId: "group-flat", name: "Mritunjay" },
  { id: "member-aisha", groupId: "group-goa", name: "Aisha" },
  { id: "member-kabir", groupId: "group-goa", name: "Kabir" },
  { id: "member-team", groupId: "group-office", name: "Team Wallet" },
  { id: "member-rohan", groupId: "group-cricket", name: "Rohan" }
];

export const sampleExpenses: Expense[] = [
  {
    id: "expense-ritik",
    groupId: "group-flat",
    amount: 6268,
    paidBy: "member-ritik",
    category: "Rent",
    description: "June rent and supplies",
    date: "2026-06-02T09:30:00.000Z"
  },
  {
    id: "expense-mritunjay",
    groupId: "group-flat",
    amount: 7062,
    paidBy: "member-mritunjay",
    category: "Grocery",
    description: "DMart monthly shopping",
    merchantName: "DMart",
    billFingerprint: "dmart-2026-06-05-880",
    date: "2026-06-05T17:45:00.000Z"
  },
  {
    id: "expense-goa-hotel",
    groupId: "group-goa",
    amount: 12400,
    paidBy: "member-aisha",
    category: "Travel",
    description: "Beach stay advance",
    date: "2026-06-07T12:00:00.000Z"
  }
];
