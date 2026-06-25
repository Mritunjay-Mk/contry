import { Balance, Expense, Member, Settlement } from "@/types";
import { roundMoney } from "@/utils/money";

export function calculateBalances(groupId: string, members: Member[], expenses: Expense[]): Balance[] {
  const groupMembers = members.filter((member) => member.groupId === groupId);
  const groupExpenses = expenses.filter((expense) => expense.groupId === groupId);
  const total = groupExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const share = groupMembers.length ? roundMoney(total / groupMembers.length) : 0;

  return groupMembers.map((member) => {
    const paid = groupExpenses
      .filter((expense) => expense.paidBy === member.id)
      .reduce((sum, expense) => sum + expense.amount, 0);

    return {
      memberId: member.id,
      paid,
      share,
      balance: roundMoney(paid - share)
    };
  });
}

export function calculateSettlements(groupId: string, members: Member[], expenses: Expense[]): Settlement[] {
  const debtors = calculateBalances(groupId, members, expenses)
    .filter((balance) => balance.balance < 0)
    .map((balance) => ({ memberId: balance.memberId, amount: roundMoney(Math.abs(balance.balance)) }));

  const creditors = calculateBalances(groupId, members, expenses)
    .filter((balance) => balance.balance > 0)
    .map((balance) => ({ memberId: balance.memberId, amount: balance.balance }));

  const settlements: Settlement[] = [];
  let debtIndex = 0;
  let creditIndex = 0;

  while (debtIndex < debtors.length && creditIndex < creditors.length) {
    const debtor = debtors[debtIndex];
    const creditor = creditors[creditIndex];
    const amount = roundMoney(Math.min(debtor.amount, creditor.amount));

    if (amount > 0) {
      settlements.push({
        id: `${groupId}-${debtor.memberId}-${creditor.memberId}-${settlements.length}`,
        groupId,
        fromMember: debtor.memberId,
        toMember: creditor.memberId,
        amount,
        status: "pending"
      });
    }

    debtor.amount = roundMoney(debtor.amount - amount);
    creditor.amount = roundMoney(creditor.amount - amount);

    if (debtor.amount === 0) debtIndex += 1;
    if (creditor.amount === 0) creditIndex += 1;
  }

  return settlements;
}
