import type { RetentionPolicy } from '../privacy/crypto';
import type { DailyRecap } from '../domain/recap';

export interface PrivateHistoryRepository {
  list(now: Date): Promise<readonly DailyRecap[]>;
  save(recap: DailyRecap, retention: RetentionPolicy): Promise<void>;
  delete(recapId: string): Promise<void>;
}
