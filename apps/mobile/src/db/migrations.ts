import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';

import { db } from './client';
// @ts-expect-error — drizzle-kit v1 beta generates migrations without `journal` but the runtime only uses `migrations`
import migrations from '../../drizzle/migrations';

export function useRunMigrations() {
  return useMigrations(db, migrations);
}
