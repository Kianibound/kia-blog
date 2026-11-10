export type FetchLike = (
  input: string | URL,
  init?: RequestInit,
) => Promise<Response>;

/** Server-only record. Tokens never leave the server store. */
export type SessionRecord = {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
  /** Epoch seconds. */
  accessExpiresAt: number;
  /** Epoch seconds. */
  refreshExpiresAt: number;
};

export interface SessionStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  /** Atomic `SET ... NX EX`; returns false when the key already exists. */
  setIfAbsent(
    key: string,
    value: string,
    ttlSeconds: number,
  ): Promise<boolean>;
  /**
   * Atomic `SET ... XX EX`; returns false when the session no longer exists.
   * Never creates a key, so a deleted/revoked session cannot be resurrected.
   */
  setIfPresent(
    key: string,
    value: string,
    ttlSeconds: number,
  ): Promise<boolean>;
  delete(key: string): Promise<void>;
}
