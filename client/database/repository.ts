import { db } from "@/database/sqlite";
import { Expense, Group, Member, Settlement } from "@/types";

// LocalStorage keys (used when db is null, e.g., on web)
const STORAGE_KEYS = {
  groups: "cnty:groups",
  members: "cnty:members",
  expenses: "cnty:expenses",
  settlements: "cnty:settlements"
};

/** Helper to get array from localStorage */
function getStorageArray<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  const json = window.localStorage.getItem(key);
  return json ? JSON.parse(json) : [];
}

/** Helper to set array to localStorage */
function setStorageArray<T>(key: string, value: T[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export const repository = {
  // ---------- GETTERS ----------
  getGroups() {
    if (db) {
      return db.getAllSync<Group>("SELECT id, name, createdAt FROM groups ORDER BY createdAt DESC");
    }
    return getStorageArray<Group>(STORAGE_KEYS.groups);
  },

  getMembers() {
    if (db) {
      return db.getAllSync<Member>("SELECT id, groupId, name FROM members");
    }
    return getStorageArray<Member>(STORAGE_KEYS.members);
  },

  getExpenses() {
    if (db) {
      return db.getAllSync<Expense>(
        "SELECT id, groupId, amount, paidBy, category, description, date, merchantName, billFingerprint FROM expenses ORDER BY date DESC"
      );
    }
    return getStorageArray<Expense>(STORAGE_KEYS.expenses);
  },

  getSettlements() {
    if (db) {
      return db.getAllSync<Settlement>("SELECT id, groupId, fromMember, toMember, amount, status FROM settlements");
    }
    return getStorageArray<Settlement>(STORAGE_KEYS.settlements);
  },

  getSettledIds() {
    if (db) {
      return db
        .getAllSync<{ id: string }>("SELECT id FROM settlements WHERE status = ?", ["settled"])
        .map((s) => s.id);
    }
    const all = getStorageArray<Settlement>(STORAGE_KEYS.settlements);
    return all.filter((s) => s.status === "settled").map((s) => s.id);
  },

  // ---------- UPSERT ----------
  upsertGroup(group: Group) {
    if (db) {
      db.runSync("INSERT OR REPLACE INTO groups (id, name, createdAt) VALUES (?, ?, ?)", [
        group.id,
        group.name,
        group.createdAt
      ]);
      return;
    }
    const items = getStorageArray<Group>(STORAGE_KEYS.groups);
    const index = items.findIndex((g) => g.id === group.id);
    if (index >= 0) {
      items[index] = group;
    } else {
      items.push(group);
    }
    setStorageArray(STORAGE_KEYS.groups, items);
  },

  upsertMember(member: Member) {
    if (db) {
      db.runSync("INSERT OR REPLACE INTO members (id, groupId, name) VALUES (?, ?, ?)", [
        member.id,
        member.groupId,
        member.name
      ]);
      return;
    }
    const items = getStorageArray<Member>(STORAGE_KEYS.members);
    const index = items.findIndex((m) => m.id === member.id);
    if (index >= 0) {
      items[index] = member;
    } else {
      items.push(member);
    }
    setStorageArray(STORAGE_KEYS.members, items);
  },

  upsertExpense(expense: Expense) {
    if (db) {
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
      return;
    }
    const items = getStorageArray<Expense>(STORAGE_KEYS.expenses);
    const index = items.findIndex((e) => e.id === expense.id);
    if (index >= 0) {
      items[index] = expense;
    } else {
      items.push(expense);
    }
    setStorageArray(STORAGE_KEYS.expenses, items);
  },

  upsertSettlement(settlement: Settlement) {
    if (db) {
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
      return;
    }
    const items = getStorageArray<Settlement>(STORAGE_KEYS.settlements);
    const index = items.findIndex((s) => s.id === settlement.id);
    if (index >= 0) {
      items[index] = settlement;
    } else {
      items.push(settlement);
    }
    setStorageArray(STORAGE_KEYS.settlements, items);
  },

  // ---------- DELETE ----------
  deleteGroup(groupId: string) {
    if (db) {
      db.runSync("DELETE FROM groups WHERE id = ?", [groupId]);
      return;
    }
    const items = getStorageArray<Group>(STORAGE_KEYS.groups);
    const filtered = items.filter((g) => g.id !== groupId);
    setStorageArray(STORAGE_KEYS.groups, filtered);
  },

  deleteMember(memberId: string) {
    if (db) {
      db.runSync("DELETE FROM members WHERE id = ?", [memberId]);
      return;
    }
    const items = getStorageArray<Member>(STORAGE_KEYS.members);
    const filtered = items.filter((m) => m.id !== memberId);
    setStorageArray(STORAGE_KEYS.members, filtered);
  },

  deleteExpense(expenseId: string) {
    if (db) {
      db.runSync("DELETE FROM expenses WHERE id = ?", [expenseId]);
      return;
    }
    const items = getStorageArray<Expense>(STORAGE_KEYS.expenses);
    const filtered = items.filter((e) => e.id !== expenseId);
    setStorageArray(STORAGE_KEYS.expenses, filtered);
  },

  deleteExpensesForGroup(groupId: string) {
    if (db) {
      db.runSync("DELETE FROM expenses WHERE groupId = ?", [groupId]);
      return;
    }
    const items = getStorageArray<Expense>(STORAGE_KEYS.expenses);
    const filtered = items.filter((e) => e.groupId !== groupId);
    setStorageArray(STORAGE_KEYS.expenses, filtered);
  },

  deleteMembersForGroup(groupId: string) {
    if (db) {
      db.runSync("DELETE FROM members WHERE groupId = ?", [groupId]);
      return;
    }
    const items = getStorageArray<Member>(STORAGE_KEYS.members);
    const filtered = items.filter((m) => m.groupId !== groupId);
    setStorageArray(STORAGE_KEYS.members, filtered);
  },

  deleteSettlementsForGroup(groupId: string) {
    if (db) {
      db.runSync("DELETE FROM settlements WHERE groupId = ?", [groupId]);
      return;
    }
    const items = getStorageArray<Settlement>(STORAGE_KEYS.settlements);
    const filtered = items.filter((s) => s.groupId !== groupId);
    setStorageArray(STORAGE_KEYS.settlements, filtered);
  },

  // ---------- BULK ----------
  deleteAllGroups() {
    if (db) {
      db.runSync("DELETE FROM groups");
      return;
    }
    setStorageArray(STORAGE_KEYS.groups, []);
  },

  deleteAllMembers() {
    if (db) {
      db.runSync("DELETE FROM members");
      return;
    }
    setStorageArray(STORAGE_KEYS.members, []);
  },

  deleteAllExpenses() {
    if (db) {
      db.runSync("DELETE FROM expenses");
      return;
    }
    setStorageArray(STORAGE_KEYS.expenses, []);
  },

  deleteAllSettlements() {
    if (db) {
      db.runSync("DELETE FROM settlements");
      return;
    }
    setStorageArray(STORAGE_KEYS.settlements, []);
  },

  clearAll() {
    if (db) {
      // Order matters due to foreign keys: delete child tables first
      this.deleteAllSettlements();
      this.deleteAllExpenses();
      this.deleteAllMembers();
      this.deleteAllGroups();
      return;
    }
    setStorageArray(STORAGE_KEYS.settlements, []);
    setStorageArray(STORAGE_KEYS.expenses, []);
    setStorageArray(STORAGE_KEYS.members, []);
    setStorageArray(STORAGE_KEYS.groups, []);
  }
};
