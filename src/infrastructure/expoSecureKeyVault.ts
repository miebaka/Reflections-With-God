import * as SecureStore from 'expo-secure-store';

export interface SecureKeyVault {
  load(name: string): Promise<string | undefined>;
  save(name: string, value: string): Promise<void>;
  remove(name: string): Promise<void>;
}

type SecureStorePort = {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string, options?: SecureStore.SecureStoreOptions): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
};

const prefix = 'reflections-with-god.keys.';

export function createExpoSecureKeyVault(store: SecureStorePort = SecureStore): SecureKeyVault {
  return {
    async load(name) {
      return (await store.getItemAsync(keyFor(name))) ?? undefined;
    },
    async save(name, value) {
      if (!value) throw new Error('An empty secret cannot be stored.');
      await store.setItemAsync(keyFor(name), value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    },
    async remove(name) {
      await store.deleteItemAsync(keyFor(name));
    },
  };
}

function keyFor(name: string): string {
  if (!/^[a-z0-9.-]{1,80}$/.test(name)) throw new Error('Secure key name is invalid.');
  return `${prefix}${name}`;
}
