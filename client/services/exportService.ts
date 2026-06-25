import { Expense, Group, Member, Settlement } from "@/types";
import { formatMoney } from "@/utils/money";

export function buildCsvReport(expenses: Expense[], members: Member[]) {
  const header = "Date,Description,Category,Paid By,Amount";
  const rows = expenses.map((expense) => {
    const paidBy = members.find((member) => member.id === expense.paidBy)?.name ?? "Unknown";
    return `${expense.date},${expense.description},${expense.category},${paidBy},${expense.amount}`;
  });
  return [header, ...rows].join("\n");
}

export function buildShareSummary(group: Group, expenses: Expense[], members: Member[], settlements: Settlement[]) {
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const perPerson = members.length ? total / members.length : 0;
  const paidLines = members.map((member) => {
    const paid = expenses.filter((expense) => expense.paidBy === member.id).reduce((sum, expense) => sum + expense.amount, 0);
    return `${member.name} Paid ${formatMoney(paid)}`;
  });
  const settlementLines = settlements.map((settlement) => {
    const from = members.find((member) => member.id === settlement.fromMember)?.name;
    const to = members.find((member) => member.id === settlement.toMember)?.name;
    return `${from} pays ${formatMoney(settlement.amount)} to ${to}`;
  });

  return [
    group.name,
    `Total Expense: ${formatMoney(total)}`,
    `Per Person: ${formatMoney(perPerson)}`,
    "",
    ...paidLines,
    "",
    "Settlement:",
    ...(settlementLines.length ? settlementLines : ["All settled"])
  ].join("\n");
}
