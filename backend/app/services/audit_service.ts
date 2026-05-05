import type { HttpContext } from '@adonisjs/core/http'
import type { IncomingMessage } from 'node:http'
import AuditLog, { type AuditAction } from '#models/audit_log'
import type User from '#models/user'

interface LogParams {
  ctx: Pick<HttpContext, 'request'>
  user: User
  restaurantId: number
  action: AuditAction
  resourceType?: string
  resourceId?: number
  resourceName?: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
}

function getClientIp(req: IncomingMessage): string | null {
  const forwarded = req.headers['x-forwarded-for']
  if (forwarded) {
    return (Array.isArray(forwarded) ? forwarded[0] : forwarded).split(',')[0].trim()
  }
  return req.socket?.remoteAddress ?? null
}

export default class AuditService {
  async log(params: LogParams): Promise<void> {
    const { ctx, user, restaurantId, action, resourceType, resourceId, resourceName, oldValues, newValues } = params

    const rawReq = ctx.request.request as IncomingMessage

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
      ipAddress: getClientIp(rawReq),
      userAgent: rawReq.headers['user-agent'] ?? null,
    })
  }

  static serialize(model: Record<string, unknown>, fields: string[]): Record<string, unknown> {
    return Object.fromEntries(fields.map((f) => [f, model[f]]))
  }
}
