import * as SQLite from 'expo-sqlite';
import type {
  ChatMessage,
  ChatRole,
  ChatStatus,
  AssistantDraft,
  ChatDraftKind,
  ChatMuscleGroup,
} from '@/types/chat';

const DB_NAME = 'jealth-chat.db';
const SCHEMA_VERSION = 3;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const getDb = (): Promise<SQLite.SQLiteDatabase> => {
  if (!dbPromise) dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  return dbPromise;
};

export const initChatDb = async (): Promise<void> => {
  const db = await getDb();
  // 기본 테이블 (v1 호환)
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
  `);

  const versionRow = await db.getFirstAsync<{ user_version: number }>(
    `PRAGMA user_version`,
  );
  const current = versionRow?.user_version ?? 0;

  if (current < 3) {
    const cols = await db.getAllAsync<{ name: string }>(
      `PRAGMA table_info(chat_messages)`,
    );
    const existing = new Set(cols.map((c) => c.name));
    const addCol = async (name: string) => {
      if (!existing.has(name)) {
        await db.execAsync(
          `ALTER TABLE chat_messages ADD COLUMN ${name} TEXT`,
        );
      }
    };
    // v2 columns
    await addCol('kind');
    await addCol('muscle_groups_json');
    await addCol('suggested_muscle_group_ids_json');
    await addCol('edited_muscle_group_ids_json');
    // v3 columns
    await addCol('original_name');
    await addCol('suggested_equipment');
    await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  }
};

export interface InsertMessageParams {
  date: string;
  role: ChatRole;
  content: string;
  draft?: AssistantDraft;
  status: ChatStatus;
  routineId?: string;
  createdAt: number;
  kind?: ChatDraftKind;
  muscleGroups?: ChatMuscleGroup[];
  suggestedMuscleGroupIds?: string[];
  editedMuscleGroupIds?: string[];
  originalName?: string;
  suggestedEquipment?: string;
}

export const insertMessage = async (p: InsertMessageParams): Promise<number> => {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO chat_messages (
       date, role, content, draft_json, status, routine_id, created_at,
       kind, muscle_groups_json, suggested_muscle_group_ids_json, edited_muscle_group_ids_json,
       original_name, suggested_equipment
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      p.date,
      p.role,
      p.content,
      p.draft ? JSON.stringify(p.draft) : null,
      p.status,
      p.routineId ?? null,
      p.createdAt,
      p.kind ?? null,
      p.muscleGroups ? JSON.stringify(p.muscleGroups) : null,
      p.suggestedMuscleGroupIds ? JSON.stringify(p.suggestedMuscleGroupIds) : null,
      p.editedMuscleGroupIds ? JSON.stringify(p.editedMuscleGroupIds) : null,
      p.originalName ?? null,
      p.suggestedEquipment ?? null,
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
    kind: ChatDraftKind | null;
    muscle_groups_json: string | null;
    suggested_muscle_group_ids_json: string | null;
    edited_muscle_group_ids_json: string | null;
    original_name: string | null;
    suggested_equipment: string | null;
  }>(
    `SELECT * FROM chat_messages WHERE date = ? ORDER BY created_at ASC`,
    [date],
  );
  const parseJson = <T>(raw: string | null): T | undefined =>
    raw ? (JSON.parse(raw) as T) : undefined;
  return rows.map((r) => ({
    id: r.id,
    date: r.date,
    role: r.role,
    content: r.content,
    draft: parseJson<AssistantDraft>(r.draft_json),
    status: r.status,
    routineId: r.routine_id ?? undefined,
    createdAt: r.created_at,
    kind: r.kind ?? undefined,
    muscleGroups: parseJson<ChatMuscleGroup[]>(r.muscle_groups_json),
    suggestedMuscleGroupIds: parseJson<string[]>(r.suggested_muscle_group_ids_json),
    editedMuscleGroupIds: parseJson<string[]>(r.edited_muscle_group_ids_json),
    originalName: r.original_name ?? undefined,
    suggestedEquipment: r.suggested_equipment ?? undefined,
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

export const updateMessageEditedMuscleGroups = async (
  id: number,
  editedMuscleGroupIds: string[] | null,
): Promise<void> => {
  const db = await getDb();
  await db.runAsync(
    `UPDATE chat_messages SET edited_muscle_group_ids_json = ? WHERE id = ?`,
    [editedMuscleGroupIds ? JSON.stringify(editedMuscleGroupIds) : null, id],
  );
};

export const updateMessageDraft = async (
  id: number,
  draft: AssistantDraft,
): Promise<void> => {
  const db = await getDb();
  await db.runAsync(
    `UPDATE chat_messages SET draft_json = ? WHERE id = ?`,
    [JSON.stringify(draft), id],
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
