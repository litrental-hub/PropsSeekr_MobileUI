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

export type MatchPrimaryAction = 'unlocked' | 'credit_required' | 'waiting' | 'accept' | 'confirm';

export function getMatchPrimaryAction(match: {
  state: string;
  currentBrokerConfirmed: boolean;
  isRevealed: boolean;
  unlockedContact: unknown | null;
  connectionRequestStatus?: string | null;
  incomingConnectionRequest?: boolean;
}): MatchPrimaryAction {
  if (match.isRevealed && match.unlockedContact) return 'unlocked';
  const state = match.state.toLowerCase();
  const requestStatus = match.connectionRequestStatus?.toLowerCase() ?? '';
  if (requestStatus === 'credit_required') return 'credit_required';
  if (match.incomingConnectionRequest || (state === 'pending_confirmation' && !match.currentBrokerConfirmed)) return 'accept';
  if (match.currentBrokerConfirmed && (state === 'pending_confirmation' || state === 'confirmed' || requestStatus === 'pending')) return 'waiting';
  return 'confirm';
}
