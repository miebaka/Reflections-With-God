import { describe, expect, it } from 'vitest';

import type { SessionRepository } from './sessionRepository';
import { initialAppSession, reduceAppSession } from './session';
import { createSessionController } from './sessionController';

function repository(overrides: Partial<SessionRepository> = {}) {
  const saved: string[] = [];
  let cleared = 0;
  const port: SessionRepository = {
    load: async () => undefined,
    save: async (session) => { saved.push(session.screen); },
    clear: async () => { cleared += 1; },
    ...overrides,
  };
  return { port, saved, cleared: () => cleared };
}

describe('session persistence controller', () => {
  const now = new Date(2026, 9, 27, 9);

  it('restores a valid session before the application becomes ready', async () => {
    const restored = reduceAppSession(initialAppSession(), { type: 'attest-adult' });
    const store = repository({ load: async () => restored });

    await expect(createSessionController(store.port).hydrate(now)).resolves.toEqual({
      session: restored, persistenceAvailable: true,
    });
  });

  it('uses a fresh session for absent or invalid snapshots', async () => {
    const store = repository();
    await expect(createSessionController(store.port).hydrate(now)).resolves.toEqual({
      session: initialAppSession(), persistenceAvailable: true,
    });
  });

  it('keeps the app usable and reports when device persistence fails', async () => {
    const store = repository({ load: async () => { throw new Error('unavailable'); } });
    await expect(createSessionController(store.port).hydrate(now)).resolves.toEqual({
      session: initialAppSession(), persistenceAvailable: false,
    });
  });

  it('serializes saves and clears so rapid updates cannot restore older state', async () => {
    const order: string[] = [];
    const store = repository({
      save: async (session) => {
        if (session.screen === 'welcome') await Promise.resolve();
        order.push(`save:${session.screen}`);
      },
      clear: async () => { order.push('clear'); },
    });
    const controller = createSessionController(store.port);
    const welcome = initialAppSession();
    const checkIn = reduceAppSession(welcome, { type: 'attest-adult' });

    const first = controller.save(welcome, now);
    const second = controller.save(checkIn, now);
    const third = controller.clear();

    await expect(Promise.all([first, second, third])).resolves.toEqual([true, true, true]);
    expect(order).toEqual(['save:welcome', 'save:check-in', 'clear']);
  });

  it('recovers the write queue after one operation fails', async () => {
    let attempts = 0;
    const store = repository({ save: async () => {
      attempts += 1;
      if (attempts === 1) throw new Error('full');
    } });
    const controller = createSessionController(store.port);

    await expect(controller.save(initialAppSession(), now)).resolves.toBe(false);
    await expect(controller.save(initialAppSession(), now)).resolves.toBe(true);
  });
});
