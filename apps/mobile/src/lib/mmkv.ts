import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV({ id: 'openhospi' });

export const mmkv = {
  getString: (key: string) => storage.getString(key),
  setString: (key: string, value: string) => storage.set(key, value),
  getBoolean: (key: string) => storage.getBoolean(key),
  setBoolean: (key: string, value: boolean) => storage.set(key, value),
  getNumber: (key: string) => storage.getNumber(key),
  setNumber: (key: string, value: number) => storage.set(key, value),
  getObject: <T>(key: string): T | undefined => {
    const str = storage.getString(key);
    return str ? (JSON.parse(str) as T) : undefined;
  },
  setObject: (key: string, value: unknown) => storage.set(key, JSON.stringify(value)),
  delete: (key: string) => storage.remove(key),
};
