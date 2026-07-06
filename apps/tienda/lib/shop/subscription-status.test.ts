import { describe, expect, it } from 'vitest';
import {
  canPauseReplenishment,
  canResumeReplenishment,
  isPastDue,
  isReplenishmentLive,
} from './subscription-status';

describe('subscription-status', () => {
  it('detecta reposición en curso', () => {
    expect(isReplenishmentLive('active')).toBe(true);
    expect(isReplenishmentLive('past_due')).toBe(true);
    expect(isReplenishmentLive('canceled')).toBe(false);
  });

  it('permite pausar solo activa o trial', () => {
    expect(canPauseReplenishment('active')).toBe(true);
    expect(canPauseReplenishment('past_due')).toBe(false);
  });

  it('permite reanudar solo pausada', () => {
    expect(canResumeReplenishment('paused')).toBe(true);
    expect(canResumeReplenishment('past_due')).toBe(false);
  });

  it('detecta past_due', () => {
    expect(isPastDue('past_due')).toBe(true);
    expect(isPastDue('active')).toBe(false);
  });
});