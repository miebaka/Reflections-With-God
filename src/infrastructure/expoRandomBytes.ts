import { getRandomBytes } from 'expo-crypto';

import type { RandomBytes } from '../privacy/crypto';

export const expoRandomBytes: RandomBytes = (length) => {
  if (!Number.isSafeInteger(length) || length < 1) throw new Error('Random byte length is invalid.');
  const bytes = getRandomBytes(length);
  if (bytes.length !== length) throw new Error('Operating-system random source failed.');
  return bytes;
};
