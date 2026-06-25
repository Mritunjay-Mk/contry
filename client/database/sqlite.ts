import { Platform } from "react-native";

type SQLiteDatabase = {
  execSync: (source: string) => void;
  runSync: (source: string, params: any[]) => unknown;
  getAllSync: {
    <T>(source: string): T[];
    <T>(source: string, params: any[]): T[];
  };
};

let db: SQLiteDatabase | null = null;

if (Platform.OS !== "web") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const SQLite = require("expo-sqlite") as typeof import("expo-sqlite");
  db = SQLite.openDatabaseSync("contry.db");
}

export function initializeDatabase() {
  if (!db) return;

  db.execSync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY NOT NULL,
      groupId TEXT NOT NULL,
      name TEXT NOT NULL,
      FOREIGN KEY (groupId) REFERENCES groups (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY NOT NULL,
      groupId TEXT NOT NULL,
      amount REAL NOT NULL,
      paidBy TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      date TEXT NOT NULL,
      merchantName TEXT,
      billFingerprint TEXT,
      FOREIGN KEY (groupId) REFERENCES groups (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settlements (
      id TEXT PRIMARY KEY NOT NULL,
      groupId TEXT NOT NULL,
      fromMember TEXT NOT NULL,
      toMember TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL,
      FOREIGN KEY (groupId) REFERENCES groups (id) ON DELETE CASCADE
    );
  `);
}

export { db };
