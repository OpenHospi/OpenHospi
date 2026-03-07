import { useEffect, useReducer } from 'react';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';

import { db } from './client';
import migrations from '../../drizzle/migrations';

interface State {
  success: boolean;
  error?: Error;
}

type Action = { type: 'migrating' } | { type: 'migrated' } | { type: 'error'; payload: Error };

const initialState: State = { success: false };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'migrating':
      return { success: false };
    case 'migrated':
      return { success: true };
    case 'error':
      return { success: false, error: action.payload };
    default:
      return state;
  }
}

export function useRunMigrations(): State {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    dispatch({ type: 'migrating' });
    migrate(db, migrations)
      .then(() => dispatch({ type: 'migrated' }))
      .catch((error: Error) => dispatch({ type: 'error', payload: error }));
  }, []);

  return state;
}
