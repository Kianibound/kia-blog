import { SessionStoreUnavailableError } from "./errors.ts";
import type { FetchLike, SessionStore } from "./types.ts";

export type UpstashStoreConfig = {
  url: string;
  token: string;
  fetchImpl?: FetchLike;
  timeoutMs?: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Minimal Upstash Redis REST client. It uses only `fetch`, so it runs on the
 * Vercel serverless runtime without a TCP Redis client. Every failure fails
 * closed with a generic error (no credentials, keys or values).
 */
export class UpstashSessionStore implements SessionStore {
  private readonly config: UpstashStoreConfig;
  private readonly fetchImpl: FetchLike;
  private readonly timeoutMs: number;

  constructor(config: UpstashStoreConfig) {
    this.config = config;
    this.fetchImpl = config.fetchImpl ?? ((input, init) => fetch(input, init));
    this.timeoutMs = config.timeoutMs ?? 5000;
  }

  private async command(args: (string | number)[]): Promise<unknown> {
    let response: Response;
    try {
      response = await this.fetchImpl(this.config.url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(args),
        cache: "no-store",
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch {
      throw new SessionStoreUnavailableError();
    }
    if (!response.ok) throw new SessionStoreUnavailableError();
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new SessionStoreUnavailableError();
    }
    if (!isRecord(payload) || "error" in payload || !("result" in payload))
      throw new SessionStoreUnavailableError();
    return payload.result;
  }

  async get(key: string): Promise<string | null> {
    const result = await this.command(["GET", key]);
    return typeof result === "string" ? result : null;
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.command([
      "SET",
      key,
      value,
      "EX",
      Math.max(1, Math.ceil(ttlSeconds)),
    ]);
  }

  async setIfAbsent(
    key: string,
    value: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    const result = await this.command([
      "SET",
      key,
      value,
      "EX",
      Math.max(1, Math.ceil(ttlSeconds)),
      "NX",
    ]);
    return result === "OK";
  }

  async setIfPresent(
    key: string,
    value: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    const result = await this.command([
      "SET",
      key,
      value,
      "EX",
      Math.max(1, Math.ceil(ttlSeconds)),
      "XX",
    ]);
    return result === "OK";
  }

  async delete(key: string): Promise<void> {
    await this.command(["DEL", key]);
  }
}
