/**
 * Retry strategy untuk sync_log.
 *
 * Aturan:
 * - Initial: retry 30 detik setelah gagal pertama
 * - Backoff eksponensial: 30s, 1m, 5m, 30m, 1h, 6h (capped)
 * - Max 10 attempts, lalu status "dead_letter" (tidak di-retry lagi)
 *
 * Pure functions, gak depend on DB. Tested via tests/unit/retry-strategy.test.ts.
 */

export const MAX_RETRY_ATTEMPTS = 10

/**
 * Backoff dalam detik per attempt.
 * attempt 1 = retry pertama setelah fail
 * attempt 2 = retry kedua, dst.
 * Setelah attempt 10, status = dead_letter.
 */
const BACKOFF_SECONDS: Record<number, number> = {
  1: 30,
  2: 60,
  3: 300,
  4: 600,
  5: 1800,
  6: 3600,
  7: 10800,
  8: 21600,
  9: 43200,
  10: 86400,
}

export function getBackoffSeconds(attempt: number): number {
  return BACKOFF_SECONDS[attempt] ?? 86400
}

/**
 * Hitung kapan record boleh di-retry lagi.
 * @param attempt nomor attempt yang baru saja gagal (1, 2, 3, ...)
 * @param now Date reference (default: now)
 * @returns ISO string untuk next_retry_at
 */
export function calculateNextRetryAt(attempt: number, now: Date = new Date()): string {
  const seconds = getBackoffSeconds(attempt)
  return new Date(now.getTime() + seconds * 1000).toISOString()
}

/**
 * Apakah record sudah mencapai max retry dan harus di-mark dead_letter?
 */
export function isDeadLetter(attempt: number): boolean {
  return attempt >= MAX_RETRY_ATTEMPTS
}

/**
 * Status transition setelah fail.
 * @returns { nextStatus, nextRetryAt, retryCount } untuk di-update ke sync_log
 */
export function getRetryDecision(
  currentRetryCount: number,
  now: Date = new Date(),
): {
  nextStatus: "failed" | "dead_letter"
  nextRetryAt: string | null
  retryCount: number
} {
  const newAttempt = currentRetryCount + 1
  if (isDeadLetter(newAttempt)) {
    return {
      nextStatus: "dead_letter",
      nextRetryAt: null,
      retryCount: newAttempt,
    }
  }
  return {
    nextStatus: "failed",
    nextRetryAt: calculateNextRetryAt(newAttempt, now),
    retryCount: newAttempt,
  }
}

/**
 * Format sisa waktu ke human-readable (untuk UI).
 * @example "30 detik", "5 menit", "1 jam", "2 hari"
 */
export function formatBackoff(seconds: number): string {
  if (seconds < 60) return `${seconds} detik`
  if (seconds < 3600) return `${Math.floor(seconds / 60)} menit`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam`
  return `${Math.floor(seconds / 86400)} hari`
}
