type Row = Record<string, any>;

class FakeDb {
  rows: Row[] = [];
  nextId = 1;
  userVersion = 0;

  async execAsync(_sql: string): Promise<void> {}

  async getFirstAsync<T = Row>(sql: string): Promise<T | null> {
    if (/PRAGMA user_version/.test(sql)) return { user_version: this.userVersion } as T;
    return null;
  }

  async getAllAsync<T = Row>(sql: string, params: any[] = []): Promise<T[]> {
    if (/FROM chat_messages/i.test(sql) && /WHERE date = \?/i.test(sql)) {
      const date = params[0];
      return this.rows
        .filter((r) => r.date === date)
        .sort((a, b) => a.created_at - b.created_at) as T[];
    }
    return [] as T[];
  }

  async runAsync(sql: string, params: any[] = []): Promise<{ lastInsertRowId: number; changes: number }> {
    if (/INSERT INTO chat_messages/i.test(sql)) {
      const id = this.nextId++;
      this.rows.push({
        id,
        date: params[0],
        role: params[1],
        content: params[2],
        draft_json: params[3],
        status: params[4],
        routine_id: params[5],
        created_at: params[6],
      });
      return { lastInsertRowId: id, changes: 1 };
    }
    if (/UPDATE chat_messages SET/i.test(sql)) {
      const id = params[params.length - 1];
      const target = this.rows.find((r) => r.id === id);
      if (target) {
        if (/status = \?/.test(sql)) target.status = params[0];
        if (/routine_id = \?/.test(sql)) target.routine_id = params[1] ?? target.routine_id;
        return { lastInsertRowId: 0, changes: 1 };
      }
    }
    return { lastInsertRowId: 0, changes: 0 };
  }
}

const db = new FakeDb();
export const openDatabaseAsync = jest.fn(async (_name: string) => db);
export type SQLiteDatabase = FakeDb;
export const __resetMockDb = () => { db.rows = []; db.nextId = 1; db.userVersion = 0; };

declare module 'expo-sqlite' {
  export const __resetMockDb: () => void;
}
