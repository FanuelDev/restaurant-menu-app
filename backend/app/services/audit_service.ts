import type { HttpContext } from '@adonisjs/core/http'
import AuditLog, { type AuditAction } from '#models/audit_log'
import type User from '#models/user'

interface LogParams {
  ctx: Pick<HttpContext, 'request'> | { request?: { ip?: () => string; header?: (h: string) => string | undefined } }
  user: User
  restaurantId: number
  action: AuditAction
  resourceType?: string
  resourceId?: number
  resourceName?: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
}

export default class AuditService {
  async log(params: LogParams): Promise<void> {
    const { ctx, user, restaurantId, action, resourceType, resourceId, resourceName, oldValues, newValues } = params

    const req = ctx.request as { ip?: () => string; header?: (h: string) => string | undefined } | undefined

    await AuditLog.create({
      restaurantId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action,
      resourceType: resourceType ?? null,
      resourceId: resourceId ?? null,
      resourceName: resourceName ?? null,
      oldValues: oldValues ?? null,
      newValues: newValues ?? null,
      ipAddress: req?.ip?.() ?? null,
      userAgent: req?.header?.('user-agent') ?? null,
    })
  }

  static serialize(model: Record<string, unknown>, fields: string[]): Record<string, unknown> {
    return Object.fromEntries(fields.map((f) => [f, model[f]]))
  }
}
