import { prisma } from "@/lib/prisma";

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
  retryAfterMs: number;
};

export type RateLimitRule = {
  limit: number;
  windowMs: number;
};

export const RATE_LIMITS = {
  loginIp: { limit: 15, windowMs: 10 * 60 * 1000 },
  loginEmail: { limit: 8, windowMs: 10 * 60 * 1000 },
  sendMessage: { limit: 30, windowMs: 60 * 1000 },
  contactWrite: { limit: 60, windowMs: 60 * 1000 },
  documentUpload: { limit: 15, windowMs: 10 * 60 * 1000 },
  ragQuery: { limit: 30, windowMs: 60 * 1000 },
  whatsappConnect: { limit: 10, windowMs: 10 * 60 * 1000 },
  userAdmin: { limit: 30, windowMs: 10 * 60 * 1000 },
  templateWrite: { limit: 30, windowMs: 10 * 60 * 1000 },
  settingsWrite: { limit: 20, windowMs: 10 * 60 * 1000 },
} as const satisfies Record<string, RateLimitRule>;

type BucketRow = {
  count: number;
  expiresAt: Date;
};

export function parseClientIp(forwardedFor: string | null | undefined): string {
  if (!forwardedFor) return "unknown";
  const first = forwardedFor.split(",")[0]?.trim();
  return first && first.length > 0 ? first : "unknown";
}

export async function consumeRateLimit(
  key: string,
  rule: RateLimitRule,
  now: Date = new Date(),
): Promise<RateLimitResult> {
  const windowEnd = new Date(now.getTime() + rule.windowMs);

  const rows = await prisma.$queryRaw<BucketRow[]>`
    INSERT INTO rate_limit_buckets ("key", "count", "expiresAt")
    VALUES (${key}, 1, ${windowEnd})
    ON CONFLICT ("key") DO UPDATE
    SET "count" = CASE
          WHEN rate_limit_buckets."expiresAt" <= ${now} THEN 1
          ELSE rate_limit_buckets."count" + 1
        END,
        "expiresAt" = CASE
          WHEN rate_limit_buckets."expiresAt" <= ${now} THEN ${windowEnd}
          ELSE rate_limit_buckets."expiresAt"
        END
    RETURNING "count", "expiresAt";
  `;

  const row = rows[0] ?? { count: 1, expiresAt: windowEnd };
  const retryAfterMs = Math.max(0, row.expiresAt.getTime() - now.getTime());

  return {
    allowed: row.count <= rule.limit,
    limit: rule.limit,
    remaining: Math.max(0, rule.limit - row.count),
    resetAt: row.expiresAt,
    retryAfterMs,
  };
}

export function rateLimitMessage(result: RateLimitResult, subject = "requests"): string {
  const seconds = Math.max(1, Math.ceil(result.retryAfterMs / 1000));
  return `Too many ${subject}. Try again in ${seconds}s.`;
}

export async function pruneExpiredRateLimits(now: Date = new Date()): Promise<number> {
  const result = await prisma.rateLimitBucket.deleteMany({
    where: { expiresAt: { lt: now } },
  });
  return result.count;
}
