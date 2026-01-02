import type { ReactNode } from 'react';
import { SQLiteProvider as ExpoSQLiteProvider } from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';
import { DATABASE_NAME } from './schema';
import { migrateDatabase } from './migrations';

export { useSQLiteContext } from 'expo-sqlite';
export { DATABASE_NAME };

export async function initDatabase(db: SQLiteDatabase): Promise<void> {
  await migrateDatabase(db);
}

interface DatabaseProviderProps {
  children: ReactNode;
}

export function DatabaseProvider({ children }: DatabaseProviderProps): ReactNode {
  return (
    <ExpoSQLiteProvider databaseName={DATABASE_NAME} onInit={initDatabase}>
      {children}
    </ExpoSQLiteProvider>
  );
}
