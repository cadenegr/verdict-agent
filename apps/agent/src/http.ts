// The only way the agent talks to websites: polite, capped and with timeouts.
import { MIN_MS_BETWEEN_REQUESTS_PER_HOST } from "@app/shared";

export const USER_AGENT = "verdict-agent/0.1 (evidence spike; one request per second)";

export interface PageResult {
  url: string;
  /** HTTP status, or null when the request failed. */
  status: number | null;
  finalUrl: string | null;
  body: string | null;
  error: string | null;
}

export interface FetcherOptions {
  /** Requests allowed in total; null for no cap. */
  maxRequests: number | null;
  timeoutMs: number;
  minGapMs?: number;
  fetch?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  clock?: () => number;
  /** Share one queue between fetchers so a host stays polite across all of them. */
  hosts?: HostQueue;
}

export interface Fetcher {
  get(url: string, options?: { readBody?: boolean }): Promise<PageResult>;
  readonly used: number;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export interface HostQueue {
  /** Resolves when it is this caller's turn to send a request to `host`. */
  wait(host: string): Promise<void>;
}

export interface HostQueueOptions {
  minGapMs?: number;
  sleep?: (ms: number) => Promise<void>;
  clock?: () => number;
}

/**
 * A queue per host: callers may overlap, requests to one host still start at
 * least `minGapMs` apart, and different hosts never wait for each other.
 */
export function createHostQueue(options: HostQueueOptions = {}): HostQueue {
  const sleep = options.sleep ?? defaultSleep;
  const clock = options.clock ?? Date.now;
  const gap = options.minGapMs ?? MIN_MS_BETWEEN_REQUESTS_PER_HOST;
  const lastByHost = new Map<string, number>();
  const turnByHost = new Map<string, Promise<void>>();
  return {
    wait(host) {
      const previous = turnByHost.get(host) ?? Promise.resolve();
      // A failed turn must not block the host for everyone after it.
      const turn = previous
        .catch(() => {})
        .then(async () => {
          const last = lastByHost.get(host);
          if (last !== undefined) {
            const wait = last + gap - clock();
            if (wait > 0) await sleep(wait);
          }
          lastByHost.set(host, clock());
        });
      turnByHost.set(host, turn);
      return turn;
    },
  };
}

export function createFetcher(options: FetcherOptions): Fetcher {
  const doFetch = options.fetch ?? fetch;
  const hosts = options.hosts ?? createHostQueue(options);
  let used = 0;

  return {
    get used() {
      return used;
    },
    async get(url, { readBody = false } = {}) {
      if (options.maxRequests !== null && used >= options.maxRequests) {
        return { url, status: null, finalUrl: null, body: null, error: "page budget used up" };
      }
      used += 1;
      await hosts.wait(new URL(url).hostname);
      try {
        const response = await doFetch(url, {
          redirect: "follow",
          headers: {
            "user-agent": USER_AGENT,
            accept: "text/html,application/json;q=0.9,*/*;q=0.5",
          },
          signal: AbortSignal.timeout(options.timeoutMs),
        });
        const body = readBody ? await response.text() : null;
        if (!readBody) await response.body?.cancel();
        return { url, status: response.status, finalUrl: response.url || url, body, error: null };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { url, status: null, finalUrl: null, body: null, error: message };
      }
    },
  };
}
