import { formatCountdown, getMatchPrimaryAction } from '../matchState';

describe('match state helpers', () => {
  it('formats the confirmation deadline and expires at zero', () => {
    const now = Date.parse('2026-08-23T10:00:00Z');
    expect(formatCountdown('2026-08-23T11:05:00Z', now)).toBe('1h 05m remaining');
    expect(formatCountdown('2026-08-23T10:00:00Z', now)).toBe('Expired');
  });

  it.each([
    [{ state: 'matched', currentBrokerConfirmed: false, isRevealed: false, unlockedContact: null }, 'confirm'],
    [{ state: 'expired', currentBrokerConfirmed: false, isRevealed: false, unlockedContact: null }, 'confirm'],
    [{ state: 'pending_confirmation', currentBrokerConfirmed: true, isRevealed: false, unlockedContact: null }, 'waiting'],
    [{ state: 'pending_confirmation', currentBrokerConfirmed: false, isRevealed: false, unlockedContact: null }, 'accept'],
    [{ state: 'confirmed', currentBrokerConfirmed: true, isRevealed: false, unlockedContact: null }, 'reveal'],
    [{ state: 'confirmed', currentBrokerConfirmed: true, isRevealed: true, unlockedContact: { ownerName: 'A' } }, 'unlocked'],
  ])('maps backend state to %s', (match, expected) => {
    expect(getMatchPrimaryAction(match)).toBe(expected);
  });
});
