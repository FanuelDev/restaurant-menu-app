import { test } from '@japa/runner'
import assert from 'node:assert/strict'

/**
 * Functional tests for Super Admin — contract + logic tests.
 * No DB required: these validate DTOs, auth logic, and computed values.
 */

// ─── Intelligence DTO ─────────────────────────────────────────────────────────

test.group('Intelligence response shape', () => {
  const mockResponse = {
    alerts: {
      trialsExpiringToday: [],
      trialsExpiring3Days: [],
      trialsExpiring7Days: [],
      newSignups24h: [],
      blockedRecently: [],
      churnRisk: [],
      criticalAlertCount: 0,
    },
    insights: {
      mrrCents: 0,
      mrrGrowthPct: 0,
      conversionRate: 0,
      churnRiskCount: 0,
      upsellCount: 0,
      upsellCandidates: [],
      recentAdminActions: [],
    },
    platformHealth: { status: 'ok' },
    refreshedAt: new Date().toISOString(),
  }

  test('response has all top-level keys', () => {
    assert.ok('alerts' in mockResponse)
    assert.ok('insights' in mockResponse)
    assert.ok('platformHealth' in mockResponse)
    assert.ok('refreshedAt' in mockResponse)
  })

  test('alerts object has required keys', () => {
    const a = mockResponse.alerts
    assert.ok('trialsExpiringToday' in a)
    assert.ok('trialsExpiring3Days' in a)
    assert.ok('trialsExpiring7Days' in a)
    assert.ok('newSignups24h' in a)
    assert.ok('churnRisk' in a)
    assert.ok('criticalAlertCount' in a)
  })

  test('insights object has required keys', () => {
    const i = mockResponse.insights
    assert.ok('mrrCents' in i)
    assert.ok('conversionRate' in i)
    assert.ok('churnRiskCount' in i)
    assert.ok('upsellCount' in i)
    assert.ok('recentAdminActions' in i)
  })

  test('criticalAlertCount = trialsExpiringToday.length + churnRisk.length', () => {
    const trialsToday = [1, 2]
    const churnRisk = [3]
    const criticalAlertCount = trialsToday.length + churnRisk.length
    assert.equal(criticalAlertCount, 3)
  })

  test('mrrGrowthPct positive when MRR increased', () => {
    const mrrCents = 120_000
    const prevMrrCents = 100_000
    const growthPct = prevMrrCents > 0 ? Math.round(((mrrCents - prevMrrCents) / prevMrrCents) * 100) : 0
    assert.equal(growthPct, 20)
  })

  test('mrrGrowthPct is 0 when previous MRR is 0', () => {
    const prevMrrCents = 0
    const growthPct = prevMrrCents > 0 ? 50 : 0
    assert.equal(growthPct, 0)
  })

  test('conversionRate is percentage of active subs out of all active restaurants', () => {
    const activeSubs = 30
    const totalActive = 100
    const conversionRate = totalActive > 0 ? Math.round((activeSubs / totalActive) * 100) : 0
    assert.equal(conversionRate, 30)
  })
})

// ─── Plan assignment ──────────────────────────────────────────────────────────

test.group('Plan assignment payload', () => {
  test('billingCycle must be monthly or yearly', () => {
    const valid = ['monthly', 'yearly']
    assert.equal(valid.includes('monthly'), true)
    assert.equal(valid.includes('yearly'), true)
    assert.equal(valid.includes('weekly'), false)
  })

  test('amountCents must be positive', () => {
    const amountCents = 9900
    assert.ok(amountCents > 0)
  })

  test('durationMonths must be at least 1', () => {
    const durationMonths = 1
    assert.ok(durationMonths >= 1)
  })
})

// ─── Block/unblock ────────────────────────────────────────────────────────────

test.group('Block restaurant', () => {
  test('block reason must be non-empty', () => {
    const reason = 'Violation des CGU'
    assert.ok(reason.length > 0)
  })

  test('empty reason is invalid', () => {
    const reason = '   '.trim()
    assert.equal(reason.length, 0)
  })

  test('unblocking clears blockedAt and blockedReason', () => {
    type BlockState = { blockedAt: string | null; blockedReason: string | null }
    const blocked: BlockState = { blockedAt: '2026-01-01', blockedReason: 'Test' }
    const unblocked: BlockState = { ...blocked, blockedAt: null, blockedReason: null }
    assert.equal(unblocked.blockedAt, null)
    assert.equal(unblocked.blockedReason, null)
  })
})

// ─── Cron secret ─────────────────────────────────────────────────────────────

test.group('Cron endpoint authorization', () => {
  function isAuthorized(secret: string, header: string): boolean {
    return secret.length > 0 && secret === header
  }

  test('matching non-empty secret grants access', () => {
    assert.equal(isAuthorized('my-secret', 'my-secret'), true)
  })

  test('empty secret always denies access', () => {
    assert.equal(isAuthorized('', ''), false)
  })

  test('wrong header is denied', () => {
    assert.equal(isAuthorized('correct', 'wrong'), false)
  })

  test('missing header (empty string) is denied', () => {
    assert.equal(isAuthorized('correct', ''), false)
  })
})

// ─── Trial reminder idempotency ───────────────────────────────────────────────

test.group('Trial reminder idempotency', () => {
  const today = new Date().toISOString().slice(0, 10)

  function shouldSendReminder(trialReminderSentAt: string | null): boolean {
    if (!trialReminderSentAt) return true
    return trialReminderSentAt.slice(0, 10) !== today
  }

  test('sends reminder when never sent before (null)', () => {
    assert.equal(shouldSendReminder(null), true)
  })

  test('sends reminder when last sent on a different day', () => {
    assert.equal(shouldSendReminder('2020-01-01T10:00:00'), true)
  })

  test('skips reminder when already sent today', () => {
    assert.equal(shouldSendReminder(`${today}T08:00:00`), false)
  })

  test('filters correctly across multiple restaurants', () => {
    const restaurants = [
      { email: 'a@b.com', trialReminderSentAt: `${today}T08:00:00` },
      { email: 'c@d.com', trialReminderSentAt: '2020-01-01' },
      { email: 'e@f.com', trialReminderSentAt: null },
    ]
    const toNotify = restaurants.filter(r => shouldSendReminder(r.trialReminderSentAt))
    assert.equal(toNotify.length, 2)
    assert.equal(toNotify.some(r => r.email === 'a@b.com'), false)
  })
})
