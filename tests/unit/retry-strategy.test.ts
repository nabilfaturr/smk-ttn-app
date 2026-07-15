import { describe, it, expect } from "vitest"
import {
  getBackoffSeconds,
  calculateNextRetryAt,
  isDeadLetter,
  getRetryDecision,
  formatBackoff,
  MAX_RETRY_ATTEMPTS,
} from "@/lib/sync/retry-strategy"

describe("retry-strategy", () => {
  describe("getBackoffSeconds", () => {
    it("attempt 1 = 30 detik", () => {
      expect(getBackoffSeconds(1)).toBe(30)
    })

    it("attempt 2 = 1 menit", () => {
      expect(getBackoffSeconds(2)).toBe(60)
    })

    it("attempt 3 = 5 menit", () => {
      expect(getBackoffSeconds(3)).toBe(300)
    })

    it("attempt 4 = 10 menit", () => {
      expect(getBackoffSeconds(4)).toBe(600)
    })

    it("attempt 5 = 30 menit", () => {
      expect(getBackoffSeconds(5)).toBe(1800)
    })

    it("attempt 6 = 1 jam", () => {
      expect(getBackoffSeconds(6)).toBe(3600)
    })

    it("attempt 10 = 24 jam (cap)", () => {
      expect(getBackoffSeconds(10)).toBe(86400)
    })

    it("attempt 99 (beyond) = 24 jam (default cap)", () => {
      expect(getBackoffSeconds(99)).toBe(86400)
    })
  })

  describe("calculateNextRetryAt", () => {
    it("attempt 1 → 30 detik dari now", () => {
      const now = new Date("2026-07-15T10:00:00.000Z")
      const next = calculateNextRetryAt(1, now)
      expect(next).toBe("2026-07-15T10:00:30.000Z")
    })

    it("attempt 5 → 30 menit dari now", () => {
      const now = new Date("2026-07-15T10:00:00.000Z")
      const next = calculateNextRetryAt(5, now)
      expect(next).toBe("2026-07-15T10:30:00.000Z")
    })

    it("attempt 10 → 24 jam dari now", () => {
      const now = new Date("2026-07-15T10:00:00.000Z")
      const next = calculateNextRetryAt(10, now)
      expect(next).toBe("2026-07-16T10:00:00.000Z")
    })
  })

  describe("isDeadLetter", () => {
    it("attempt 1-9 bukan dead_letter", () => {
      for (let i = 1; i < MAX_RETRY_ATTEMPTS; i++) {
        expect(isDeadLetter(i)).toBe(false)
      }
    })

    it(`attempt ${MAX_RETRY_ATTEMPTS} adalah dead_letter`, () => {
      expect(isDeadLetter(MAX_RETRY_ATTEMPTS)).toBe(true)
    })

    it("attempt beyond MAX juga dead_letter", () => {
      expect(isDeadLetter(MAX_RETRY_ATTEMPTS + 1)).toBe(true)
    })
  })

  describe("getRetryDecision", () => {
    it("currentRetryCount=0 (first fail) → nextStatus=failed, nextRetryAt di masa depan, retryCount=1", () => {
      const decision = getRetryDecision(0)
      expect(decision.nextStatus).toBe("failed")
      expect(decision.retryCount).toBe(1)
      expect(decision.nextRetryAt).not.toBeNull()
      expect(new Date(decision.nextRetryAt!).getTime()).toBeGreaterThan(Date.now())
    })

    it("currentRetryCount=9 → nextStatus=dead_letter, retryCount=10", () => {
      const decision = getRetryDecision(9)
      expect(decision.nextStatus).toBe("dead_letter")
      expect(decision.retryCount).toBe(10)
      expect(decision.nextRetryAt).toBeNull()
    })

    it("currentRetryCount=5 → nextStatus=failed dengan backoff attempt 6 = 1 jam", () => {
      const now = new Date("2026-07-15T10:00:00.000Z")
      const decision = getRetryDecision(5, now)
      expect(decision.nextStatus).toBe("failed")
      expect(decision.retryCount).toBe(6)
      // attempt 6 = 3600s = 1 jam
      expect(decision.nextRetryAt).toBe("2026-07-15T11:00:00.000Z")
    })

    it("currentRetryCount=0 dengan fixed now → nextStatus=failed, nextRetryAt = now+30s", () => {
      const now = new Date("2026-07-15T10:00:00.000Z")
      const decision = getRetryDecision(0, now)
      expect(decision.nextStatus).toBe("failed")
      expect(decision.retryCount).toBe(1)
      expect(decision.nextRetryAt).toBe("2026-07-15T10:00:30.000Z")
    })
  })

  describe("formatBackoff", () => {
    it("< 60 detik", () => {
      expect(formatBackoff(30)).toBe("30 detik")
      expect(formatBackoff(45)).toBe("45 detik")
    })

    it("< 1 jam", () => {
      expect(formatBackoff(60)).toBe("1 menit")
      expect(formatBackoff(300)).toBe("5 menit")
    })

    it("< 1 hari", () => {
      expect(formatBackoff(3600)).toBe("1 jam")
      expect(formatBackoff(7200)).toBe("2 jam")
    })

    it("≥ 1 hari", () => {
      expect(formatBackoff(86400)).toBe("1 hari")
      expect(formatBackoff(172800)).toBe("2 hari")
    })
  })
})
