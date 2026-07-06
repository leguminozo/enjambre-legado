import { describe, expect, it } from 'vitest';
import {
  SUBSCRIPTION_BLOCKING_STATUSES,
  SUBSCRIPTION_VISIBLE_STATUSES,
  canPauseReplenishment,
  canResumeReplenishment,
  isPastDue,
  isReplenishmentLive,
} from '../subscription-status';

describe('subscription-status', () => {
  it('past_due es visible pero no bloquea alta nueva', () => {
    expect(SUBSCRIPTION_VISIBLE_STATUSES).toContain('past_due');
    expect(SUBSCRIPTION_BLOCKING_STATUSES).not.toContain('past_due');
  });

  it('helpers de acción', () => {
    expect(canPauseReplenishment('active')).toBe(true);
    expect(canPauseReplenishment('past_due')).toBe(false);
    expect(canResumeReplenishment('paused')).toBe(true);
    expect(isPastDue('past_due')).toBe(true);
    expect(isReplenishmentLive('trialing')).toBe(true);
  });
});