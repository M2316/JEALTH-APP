import * as SQLite from 'expo-sqlite';
import type { ChatMessage, ChatRole, ChatStatus, AssistantDraft } from '@/types/chat';

const DB_NAME = 'jealth-chat.db';
const SCHEMA_VERSION = 1;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const getDb = (): Promise<SQLite.SQLiteDatabase> => {
  if (!dbPromise) dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  return dbPromise;
};

export const initChatDb = async (): Promise<void> => {
  const db = await getDb();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      date         TEXT    NOT NULL,
      role         TEXT    NOT NULL,
      content      TEXT    NOT NULL,
      draft_json   TEXT,
      status       TEXT    NOT NULL DEFAULT 'pending',
      routine_id   TEXT,
      created_at   INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_chat_messages_date ON chat_messages(date, created_at);
    PRAGMA user_version = ${SCHEMA_VERSION};
  `);
};

export interface InsertMessageParams {
  date: string;
  role: ChatRole;
  content: string;
  draft?: AssistantDraft;
  status: ChatStatus;
  routineId?: string;
  createdAt: number;
}

export const insertMessage = async (p: InsertMessageParams): Promise<number> => {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO chat_messages (date, role, content, draft_json, status, routine_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      p.date, p.role, p.content,
      p.draft ? JSON.stringify(p.draft) : null,
      p.status, p.routineId ?? null, p.createdAt,
    ],
  );
  return result.lastInsertRowId;
};

export const loadMessagesForDate = async (date: string): Promise<ChatMessage[]> => {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: number; date: string; role: ChatRole; content: string;
    draft_json: string | null; status: ChatStatus;
    routine_id: string | null; created_at: number;
  }>(
    `SELECT * FROM chat_messages WHERE date = ? ORDER BY created_at ASC`,
    [date],
  );
  return rows.map((r) => ({
    id: r.id, date: r.date, role: r.role, content: r.content,
    draft: r.draft_json ? (JSON.parse(r.draft_json) as AssistantDraft) : undefined,
    status: r.status,
    routineId: r.routine_id ?? undefined,
    createdAt: r.created_at,
  }));
};

export const updateMessageStatus = async (
  id: number, status: ChatStatus, routineId?: string,
): Promise<void> => {
  const db = await getDb();
  await db.runAsync(
    `UPDATE chat_messages SET status = ?, routine_id = ? WHERE id = ?`,
    [status, routineId ?? null, id],
  );
};

export const getContextSinceLastApproved = async (
  date: string,
): Promise<Array<{ role: ChatRole; content: string }>> => {
  const all = await loadMessagesForDate(date);
  let cutoff = -1;
  for (let i = all.length - 1; i >= 0; i--) {
    if (all[i].role === 'assistant' && all[i].status === 'saved') {
      cutoff = i;
      break;
    }
  }
  return all
    .slice(cutoff + 1)
    .filter((m) => m.status !== 'discarded' && m.status !== 'error')
    .map((m) => ({ role: m.role, content: m.content }));
};

export const discardPendingForDate = async (date: string): Promise<void> => {
  const db = await getDb();
  await db.runAsync(
    `UPDATE chat_messages SET status = 'discarded', routine_id = NULL WHERE date = ? AND status = 'pending' AND role = 'assistant'`,
    [date],
  );
};
