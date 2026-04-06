import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type WindowEntry = {
  count: number;
  resetAt: number;
};

const memoryStore = new Map<string, WindowEntry>();

const LIMIT = 10;
const WINDOW_MS = 15 * 60 * 1000;

function createUpstashLimiter() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  const redis = new Redis({ url, token });
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(LIMIT, "15 m"),
    analytics: true,
    prefix: "sysboard:login",
  });
}

const upstashLimiter = createUpstashLimiter();

export async function assertLoginRateLimit(identifier: string): Promise<void> {
  if (upstashLimiter) {
    const result = await upstashLimiter.limit(identifier);
    if (!result.success) {
      throw new Error("Too many login attempts. Try again later.");
    }
    return;
  }

  const now = Date.now();
  const entry = memoryStore.get(identifier);

  if (!entry || entry.resetAt <= now) {
    memoryStore.set(identifier, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });
    return;
  }

  if (entry.count >= LIMIT) {
    throw new Error("Too many login attempts. Try again later.");
  }

  entry.count += 1;
  memoryStore.set(identifier, entry);
}
