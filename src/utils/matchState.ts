export function formatCountdown(windowExpiresAt: string | null, nowMs = Date.now()): string {
  if (!windowExpiresAt) return '';
  const remaining = Math.max(0, new Date(windowExpiresAt).getTime() - nowMs);
  if (remaining === 0) return 'Expired';
  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return hours > 0
    ? `${hours}h ${minutes.toString().padStart(2, '0')}m remaining`
    : `${minutes}m ${seconds.toString().padStart(2, '0')}s remaining`;
}

export type MatchPrimaryAction = 'unlocked' | 'reveal' | 'waiting' | 'accept' | 'confirm';

export function getMatchPrimaryAction(match: {
  state: string;
  currentBrokerConfirmed: boolean;
  isRevealed: boolean;
  unlockedContact: unknown | null;
}): MatchPrimaryAction {
  if (match.isRevealed && match.unlockedContact) return 'unlocked';
  if (match.state === 'confirmed') return 'reveal';
  if (match.state === 'pending_confirmation') {
    return match.currentBrokerConfirmed ? 'waiting' : 'accept';
  }
  return 'confirm';
}
