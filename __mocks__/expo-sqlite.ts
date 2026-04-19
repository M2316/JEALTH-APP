type Row = Record<string, any>;

class FakeDb {
  rows: Row[] = [];
  nextId = 1;
  userVersion = 0;
  columns: Set<string> = new Set([
    'id', 'date', 'role', 'content', 'draft_json', 'status',
    'routine_id', 'created_at',
  ]);

  async execAsync(sql: string): Promise<void> {
    // ALTER TABLE ADD COLUMN — add to known columns
    const alterMatch = sql.match(/ALTER\s+TABLE\s+chat_messages\s+ADD\s+COLUMN\s+(\w+)/i);
    if (alterMatch) {
      this.columns.add(alterMatch[1]);
      return;
    }
    // PRAGMA user_version = N
    const versionMatch = sql.match(/PRAGMA\s+user_version\s*=\s*(\d+)/i);
    if (versionMatch) {
      this.userVersion = Number(versionMatch[1]);
      return;
    }
    // CREATE TABLE / CREATE INDEX — no-op
  }

  async getFirstAsync<T = Row>(sql: string): Promise<T | null> {
    if (/PRAGMA\s+user_version/i.test(sql)) {
      return { user_version: this.userVersion } as T;
    }
    return null;
  }

  async getAllAsync<T = Row>(sql: string, params: any[] = []): Promise<T[]> {
    if (/PRAGMA\s+table_info\(chat_messages\)/i.test(sql)) {
      return Array.from(this.columns).map((name) => ({ name })) as T[];
    }
    if (/FROM chat_messages/i.test(sql) && /WHERE date = \?/i.test(sql)) {
      const date = params[0];
      return this.rows
        .filter((r) => r.date === date)
        .sort((a, b) => a.created_at - b.created_at) as T[];
    }
    return [] as T[];
  }

  async runAsync(
    sql: string,
    params: any[] = [],
  ): Promise<{ lastInsertRowId: number; changes: number }> {
    if (/INSERT INTO chat_messages/i.test(sql)) {
      const id = this.nextId++;
      // params length is 7 for v1 insert, 11 for v2 insert
      const row: Row = {
        id,
        date: params[0],
        role: params[1],
        content: params[2],
        draft_json: params[3],
        status: params[4],
        routine_id: params[5],
        created_at: params[6],
      };
      if (params.length >= 11) {
        row.kind = params[7];
        row.muscle_groups_json = params[8];
        row.suggested_muscle_group_ids_json = params[9];
        row.edited_muscle_group_ids_json = params[10];
      } else {
        row.kind = null;
        row.muscle_groups_json = null;
        row.suggested_muscle_group_ids_json = null;
        row.edited_muscle_group_ids_json = null;
      }
      this.rows.push(row);
      return { lastInsertRowId: id, changes: 1 };
    }
    if (/UPDATE chat_messages SET/i.test(sql)) {
      // UPDATE status + routine_id WHERE id
      if (/status\s*=\s*\?\s*,\s*routine_id\s*=\s*\?/i.test(sql)) {
        const id = params[params.length - 1];
        const target = this.rows.find((r) => r.id === id);
        if (target) {
          target.status = params[0];
          target.routine_id = params[1] ?? target.routine_id;
          return { lastInsertRowId: 0, changes: 1 };
        }
      }
      // UPDATE edited_muscle_group_ids_json WHERE id
      if (/edited_muscle_group_ids_json\s*=\s*\?/i.test(sql)) {
        const id = params[params.length - 1];
        const target = this.rows.find((r) => r.id === id);
        if (target) {
          target.edited_muscle_group_ids_json = params[0];
          return { lastInsertRowId: 0, changes: 1 };
        }
      }
      // UPDATE draft_json WHERE id
      if (/draft_json\s*=\s*\?/i.test(sql) && !/INSERT/i.test(sql)) {
        const id = params[params.length - 1];
        const target = this.rows.find((r) => r.id === id);
        if (target) {
          target.draft_json = params[0];
          return { lastInsertRowId: 0, changes: 1 };
        }
      }
      // UPDATE status='discarded' WHERE date AND status='pending'
      if (/status\s*=\s*'discarded'/i.test(sql) && /WHERE\s+date\s*=\s*\?/i.test(sql)) {
        const date = params[0];
        let changes = 0;
        for (const r of this.rows) {
          if (r.date === date && r.status === 'pending' && r.role === 'assistant') {
            r.status = 'discarded';
            r.routine_id = null;
            changes++;
          }
        }
        return { lastInsertRowId: 0, changes };
      }
      // Fallback — old pattern: `status = ?` + id at end
      if (/status\s*=\s*\?/i.test(sql)) {
        const id = params[params.length - 1];
        const target = this.rows.find((r) => r.id === id);
        if (target) {
          target.status = params[0];
          if (params.length >= 3) {
            target.routine_id = params[1] ?? target.routine_id;
          }
          return { lastInsertRowId: 0, changes: 1 };
        }
      }
    }
    return { lastInsertRowId: 0, changes: 0 };
  }
}

const db = new FakeDb();
export const openDatabaseAsync = jest.fn(async (_name: string) => db);
export type SQLiteDatabase = FakeDb;
export const __resetMockDb = () => {
  db.rows = [];
  db.nextId = 1;
  db.userVersion = 0;
  db.columns = new Set([
    'id', 'date', 'role', 'content', 'draft_json', 'status',
    'routine_id', 'created_at',
  ]);
};

declare module 'expo-sqlite' {
  export const __resetMockDb: () => void;
}
