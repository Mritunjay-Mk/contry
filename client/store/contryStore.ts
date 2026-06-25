import { create } from "zustand";

import { repository } from "@/database/repository";
import { Expense, ExpenseCategory, Group, Member, Settlement } from "@/types";
import { calculateBalances, calculateSettlements } from "@/utils/settlements";

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

type ContryState = {
  groups: Group[];
  members: Member[];
  expenses: Expense[];
  settledIds: string[];
  selectedGroupId: string;
  seed: () => void;
  selectGroup: (groupId: string) => void;
  addGroup: (name: string) => void;
  updateGroup: (groupId: string, name: string) => void;
  deleteGroup: (groupId: string) => void;
  addMember: (groupId: string, name: string) => void;
  updateMember: (memberId: string, name: string) => void;
  removeMember: (memberId: string) => void;
  addExpense: (expense: Omit<Expense, "id">) => void;
  updateExpense: (expenseId: string, updates: Partial<Expense>) => void;
  deleteExpense: (expenseId: string) => void;
  markSettlementSettled: (settlementId: string) => void;
  getGroupMembers: (groupId?: string) => Member[];
  getGroupExpenses: (groupId?: string) => Expense[];
  getSettlements: (groupId?: string) => Settlement[];
  getDashboardStats: (groupId?: string) => {
    totalExpense: number;
    totalMembers: number;
    perPersonCost: number;
    pendingSettlement: number;
    topSpender?: Member;
  };
  isDuplicateBill: (fingerprint?: string) => boolean;
};

export const useContryStore = create<ContryState>((set, get) => ({
  groups: [],
  members: [],
  expenses: [],
  settledIds: [],
  selectedGroupId: "",
  seed: () => {
    const groups = repository.getGroups();
    const members = repository.getMembers();
    const expenses = repository.getExpenses();
    const settledIds = repository.getSettledIds();

    set((state) => ({
      groups,
      members,
      expenses,
      settledIds,
      selectedGroupId: state.selectedGroupId || groups[0]?.id || ""
    }));
  },
  selectGroup: (selectedGroupId) => set({ selectedGroupId }),
  addGroup: (name) => {
    const group = { id: uid("group"), name, createdAt: new Date().toISOString() };
    repository.upsertGroup(group);
    set((state) => ({ groups: [group, ...state.groups], selectedGroupId: group.id }));
  },
  updateGroup: (groupId, name) =>
    set((state) => {
      const groups = state.groups.map((group) => (group.id === groupId ? { ...group, name } : group));
      groups.find((group) => group.id === groupId) && repository.upsertGroup(groups.find((group) => group.id === groupId)!);
      return { groups };
    }),
  deleteGroup: (groupId) =>
    set((state) => {
      repository.deleteSettlementsForGroup(groupId);
      repository.deleteExpensesForGroup(groupId);
      repository.deleteMembersForGroup(groupId);
      repository.deleteGroup(groupId);
      const groups = state.groups.filter((group) => group.id !== groupId);
      return {
        groups,
        members: state.members.filter((member) => member.groupId !== groupId),
        expenses: state.expenses.filter((expense) => expense.groupId !== groupId),
        selectedGroupId: groups[0]?.id ?? ""
      };
    }),
  addMember: (groupId, name) => {
    const member = { id: uid("member"), groupId, name };
    repository.upsertMember(member);
    set((state) => ({ members: [...state.members, member] }));
  },
  updateMember: (memberId, name) =>
    set((state) => {
      const members = state.members.map((member) => (member.id === memberId ? { ...member, name } : member));
      members.find((member) => member.id === memberId) && repository.upsertMember(members.find((member) => member.id === memberId)!);
      return { members };
    }),
  removeMember: (memberId) =>
    set((state) => {
      state.expenses.filter((expense) => expense.paidBy === memberId).forEach((expense) => repository.deleteExpense(expense.id));
      repository.deleteMember(memberId);

      return {
        members: state.members.filter((member) => member.id !== memberId),
        expenses: state.expenses.filter((expense) => expense.paidBy !== memberId)
      };
    }),
  addExpense: (expenseInput) => {
    const expense = { ...expenseInput, id: uid("expense") };
    repository.upsertExpense(expense);
    set((state) => ({ expenses: [expense, ...state.expenses] }));
  },
  updateExpense: (expenseId, updates) =>
    set((state) => {
      const expenses = state.expenses.map((expense) => (expense.id === expenseId ? { ...expense, ...updates } : expense));
      expenses.find((expense) => expense.id === expenseId) && repository.upsertExpense(expenses.find((expense) => expense.id === expenseId)!);
      return { expenses };
    }),
  deleteExpense: (expenseId) =>
    set((state) => {
      repository.deleteExpense(expenseId);
      return { expenses: state.expenses.filter((expense) => expense.id !== expenseId) };
    }),
  markSettlementSettled: (settlementId) =>
    set((state) => {
      const settlement = state.getSettlements().find((item) => item.id === settlementId);
      if (settlement) {
        repository.upsertSettlement({ ...settlement, status: "settled" });
      }
      return { settledIds: state.settledIds.includes(settlementId) ? state.settledIds : [...state.settledIds, settlementId] };
    }),
  getGroupMembers: (groupId = get().selectedGroupId) => get().members.filter((member) => member.groupId === groupId),
  getGroupExpenses: (groupId = get().selectedGroupId) => get().expenses.filter((expense) => expense.groupId === groupId),
  getSettlements: (groupId = get().selectedGroupId) => {
    const settlements = calculateSettlements(groupId, get().members, get().expenses);
    return settlements.map((settlement) => ({
      ...settlement,
      status: get().settledIds.includes(settlement.id) ? "settled" : "pending"
    }));
  },
  getDashboardStats: (groupId = get().selectedGroupId) => {
    const members = get().getGroupMembers(groupId);
    const expenses = get().getGroupExpenses(groupId);
    const totalExpense = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const balances = calculateBalances(groupId, get().members, get().expenses);
    const pendingSettlement = get()
      .getSettlements(groupId)
      .filter((settlement) => settlement.status === "pending")
      .reduce((sum, settlement) => sum + settlement.amount, 0);
    const topBalance = [...balances].sort((a, b) => b.paid - a.paid)[0];

    return {
      totalExpense,
      totalMembers: members.length,
      perPersonCost: members.length ? totalExpense / members.length : 0,
      pendingSettlement,
      topSpender: members.find((member) => member.id === topBalance?.memberId)
    };
  },
  isDuplicateBill: (fingerprint) => Boolean(fingerprint && get().expenses.some((expense) => expense.billFingerprint === fingerprint))
}));

export const createExpenseDraft = (
  groupId: string,
  paidBy: string,
  amount: number,
  category: ExpenseCategory,
  description: string
): Omit<Expense, "id"> => ({
  groupId,
  paidBy,
  amount,
  category,
  description,
  date: new Date().toISOString()
});
