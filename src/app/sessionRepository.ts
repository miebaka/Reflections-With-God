import type { AppSession } from './session';

export interface SessionRepository {
  load(now: Date): Promise<AppSession | undefined>;
  save(session: AppSession, now: Date): Promise<void>;
  clear(): Promise<void>;
}
