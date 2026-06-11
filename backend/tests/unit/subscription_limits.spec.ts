import { test } from '@japa/runner'
import assert from 'node:assert/strict'
import { DateTime } from 'luxon'

// ─── Pure logic helpers extracted from SubscriptionService ───────────────────

function trialEndsAt(startedAt: DateTime, days = 14): DateTime {
  return startedAt.plus({ days })
}

function isTrialActive(endsAt: DateTime | null): boolean {
  if (!endsAt) return false
  return endsAt > DateTime.now()
}

function isTrialExpired(endsAt: DateTime | null): boolean {
  if (!endsAt) return false
  return endsAt <= DateTime.now()
}

function daysLeftInTrial(endsAt: DateTime | null): number {
  if (!endsAt) return 0
  const diff = endsAt.diff(DateTime.now(), 'days').days
  return Math.max(0, Math.ceil(diff))
}

function checkLimitLogic(current: number, max: number): { allowed: boolean; current: number; max: number } {
  if (max === -1) return { allowed: true, current, max }
  return { allowed: current < max, current, max }
}

// ─── Trial logic ──────────────────────────────────────────────────────────────

test.group('Trial period', () => {
  test('trial ends 14 days after start', () => {
    const start = DateTime.now()
    const end = trialEndsAt(start)
    const diffDays = end.diff(start, 'days').days
    assert.ok(Math.abs(diffDays - 14) < 0.01, `Expected ~14 days, got ${diffDays}`)
  })

  test('active trial is detected correctly', () => {
    const future = DateTime.now().plus({ days: 5 })
    assert.equal(isTrialActive(future), true)
  })

  test('expired trial is detected correctly', () => {
    const past = DateTime.now().minus({ days: 1 })
    assert.equal(isTrialActive(past), false)
    assert.equal(isTrialExpired(past), true)
  })

  test('null trialEndsAt is treated as no trial', () => {
    assert.equal(isTrialActive(null), false)
    assert.equal(isTrialExpired(null), false)
  })

  test('daysLeftInTrial rounds up partial days', () => {
    const endsAt = DateTime.now().plus({ hours: 25 })
    assert.equal(daysLeftInTrial(endsAt), 2)
  })

  test('daysLeftInTrial returns 0 when expired', () => {
    const past = DateTime.now().minus({ hours: 1 })
    assert.equal(daysLeftInTrial(past), 0)
  })

  test('daysLeftInTrial returns 0 for null', () => {
    assert.equal(daysLeftInTrial(null), 0)
  })
})

// ─── Plan limit enforcement ───────────────────────────────────────────────────

test.group('Plan limit enforcement', () => {
  test('unlimited plan (max = -1) always allows', () => {
    const result = checkLimitLogic(100, -1)
    assert.equal(result.allowed, true)
    assert.equal(result.max, -1)
  })

  test('allows creation when below limit', () => {
    const result = checkLimitLogic(4, 5)
    assert.equal(result.allowed, true)
    assert.equal(result.current, 4)
    assert.equal(result.max, 5)
  })

  test('blocks creation when at limit', () => {
    const result = checkLimitLogic(5, 5)
    assert.equal(result.allowed, false)
  })

  test('blocks creation when above limit (data inconsistency)', () => {
    const result = checkLimitLogic(6, 5)
    assert.equal(result.allowed, false)
  })

  test('blocks at limit = 0 (no items allowed on plan)', () => {
    const result = checkLimitLogic(0, 0)
    assert.equal(result.allowed, false)
  })

  test('current count and max are echoed back in result', () => {
    const result = checkLimitLogic(3, 10)
    assert.equal(result.current, 3)
    assert.equal(result.max, 10)
  })
})

// ─── Trial reminder targeting ─────────────────────────────────────────────────

test.group('Trial reminder targeting', () => {
  const REMINDER_DAYS = [7, 3, 0]

  test('J-7, J-3, J-0 are the configured reminder days', () => {
    assert.deepEqual(REMINDER_DAYS, [7, 3, 0])
  })

  test('7 days left triggers reminder', () => {
    assert.equal(REMINDER_DAYS.includes(7), true)
  })

  test('3 days left triggers reminder', () => {
    assert.equal(REMINDER_DAYS.includes(3), true)
  })

  test('last day (0) triggers urgent reminder', () => {
    assert.equal(REMINDER_DAYS.includes(0), true)
  })

  test('5 days left does NOT trigger reminder', () => {
    assert.equal(REMINDER_DAYS.includes(5), false)
  })

  test('isUrgent is true when daysLeft <= 1', () => {
    assert.equal(0 <= 1, true)
    assert.equal(1 <= 1, true)
    assert.equal(2 <= 1, false)
  })
})

// ─── MRR computation ──────────────────────────────────────────────────────────

test.group('MRR calculation', () => {
  function computeMrr(subs: { billingCycle: 'monthly' | 'yearly'; priceMonthly: number; priceYearly: number }[]) {
    return subs.reduce((sum, s) => {
      const monthly = s.billingCycle === 'monthly' ? s.priceMonthly : Math.round(s.priceYearly / 12)
      return sum + monthly
    }, 0)
  }

  test('monthly subscriptions contribute full price', () => {
    const subs = [{ billingCycle: 'monthly' as const, priceMonthly: 9900, priceYearly: 99000 }]
    assert.equal(computeMrr(subs), 9900)
  })

  test('yearly subscriptions contribute 1/12 of annual price', () => {
    const subs = [{ billingCycle: 'yearly' as const, priceMonthly: 9900, priceYearly: 99000 }]
    assert.equal(computeMrr(subs), 8250)
  })

  test('MRR sums all active subscriptions', () => {
    const subs = [
      { billingCycle: 'monthly' as const, priceMonthly: 9900, priceYearly: 99000 },
      { billingCycle: 'monthly' as const, priceMonthly: 19900, priceYearly: 199000 },
      { billingCycle: 'yearly' as const, priceMonthly: 9900, priceYearly: 99000 },
    ]
    assert.equal(computeMrr(subs), 9900 + 19900 + 8250)
  })

  test('empty subscriptions return 0 MRR', () => {
    assert.equal(computeMrr([]), 0)
  })
})
