import { initialAppSession, type AppSession } from './session';
import type { SessionRepository } from './sessionRepository';

export type HydratedSession = {
  session: AppSession;
  persistenceAvailable: boolean;
};

export type SessionController = {
  hydrate(now: Date): Promise<HydratedSession>;
  save(session: AppSession, now: Date): Promise<boolean>;
  clear(): Promise<boolean>;
};

export function createSessionController(repository: SessionRepository): SessionController {
  let pending: Promise<boolean> = Promise.resolve(true);

  function enqueue(operation: () => Promise<void>): Promise<boolean> {
    const run = async () => {
      try {
        await operation();
        return true;
      } catch {
        return false;
      }
    };
    pending = pending.then(run, run);
    return pending;
  }

  return {
    async hydrate(now) {
      try {
        return {
          session: await repository.load(now) ?? initialAppSession(),
          persistenceAvailable: true,
        };
      } catch {
        return { session: initialAppSession(), persistenceAvailable: false };
      }
    },
    save(session, now) {
      return enqueue(() => repository.save(session, now));
    },
    clear() {
      return enqueue(() => repository.clear());
    },
  };
}
