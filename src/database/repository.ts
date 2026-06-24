import { db } from "@/database/sqlite";
import { Expense, Group, Member, Settlement } from "@/types";

export const repository = {
  getGroups() {
    if (!db) return [];
    return db.getAllSync<Group>("SELECT id, name, createdAt FROM groups ORDER BY createdAt DESC");
  },
  getMembers() {
    if (!db) return [];
    return db.getAllSync<Member>("SELECT id, groupId, name FROM members");
  },
  getExpenses() {
    if (!db) return [];
    return db.getAllSync<Expense>(
      "SELECT id, groupId, amount, paidBy, category, description, date, merchantName, billFingerprint FROM expenses ORDER BY date DESC"
    );
  },
  getSettledIds() {
    if (!db) return [];
    return db
      .getAllSync<{ id: string }>("SELECT id FROM settlements WHERE status = ?", ["settled"])
      .map((settlement) => settlement.id);
  },
  upsertGroup(group: Group) {
    if (!db) return;
    db.runSync("INSERT OR REPLACE INTO groups (id, name, createdAt) VALUES (?, ?, ?)", [
      group.id,
      group.name,
      group.createdAt
    ]);
  },
  upsertMember(member: Member) {
    if (!db) return;
    db.runSync("INSERT OR REPLACE INTO members (id, groupId, name) VALUES (?, ?, ?)", [
      member.id,
      member.groupId,
      member.name
    ]);
  },
  upsertExpense(expense: Expense) {
    if (!db) return;
    db.runSync(
      "INSERT OR REPLACE INTO expenses (id, groupId, amount, paidBy, category, description, date, merchantName, billFingerprint) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        expense.id,
        expense.groupId,
        expense.amount,
        expense.paidBy,
        expense.category,
        expense.description,
        expense.date,
        expense.merchantName ?? null,
        expense.billFingerprint ?? null
      ]
    );
  },
  upsertSettlement(settlement: Settlement) {
    if (!db) return;
    db.runSync(
      "INSERT OR REPLACE INTO settlements (id, groupId, fromMember, toMember, amount, status) VALUES (?, ?, ?, ?, ?, ?)",
      [
        settlement.id,
        settlement.groupId,
        settlement.fromMember,
        settlement.toMember,
        settlement.amount,
        settlement.status
      ]
    );
  },
  deleteGroup(groupId: string) {
    if (!db) return;
    db.runSync("DELETE FROM groups WHERE id = ?", [groupId]);
  },
  deleteMember(memberId: string) {
    if (!db) return;
    db.runSync("DELETE FROM members WHERE id = ?", [memberId]);
  },
  deleteExpense(expenseId: string) {
    if (!db) return;
    db.runSync("DELETE FROM expenses WHERE id = ?", [expenseId]);
  },
  deleteExpensesForGroup(groupId: string) {
    if (!db) return;
    db.runSync("DELETE FROM expenses WHERE groupId = ?", [groupId]);
  },
  deleteMembersForGroup(groupId: string) {
    if (!db) return;
    db.runSync("DELETE FROM members WHERE groupId = ?", [groupId]);
  },
  deleteSettlementsForGroup(groupId: string) {
    if (!db) return;
    db.runSync("DELETE FROM settlements WHERE groupId = ?", [groupId]);
  }
};
