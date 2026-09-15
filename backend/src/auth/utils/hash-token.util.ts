import { createHash } from 'node:crypto';

export function hashToken(token: string): string {
  // Create a deterministic SHA-256 hash for secure token storage
  return createHash('sha256').update(token).digest('hex');
}
