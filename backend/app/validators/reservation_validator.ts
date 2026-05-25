import vine from '@vinejs/vine'

export const createReservationValidator = vine.compile(
  vine.object({
    customerName: vine.string().trim().minLength(2).maxLength(255),
    customerPhone: vine.string().trim().minLength(8).maxLength(50),
    customerEmail: vine.string().trim().email().maxLength(255).optional().nullable(),
    reservedDate: vine.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    reservedTime: vine.string().regex(/^\d{2}:\d{2}$/),
    guestsCount: vine.number().min(1).max(50),
    specialRequests: vine.string().trim().maxLength(1000).optional().nullable(),
  })
)

export const updateReservationStatusValidator = vine.compile(
  vine.object({
    status: vine.enum(['pending', 'confirmed', 'cancelled', 'no_show'] as const),
    notes: vine.string().trim().maxLength(1000).optional().nullable(),
  })
)

/** Création d'une réservation depuis le back-office (admin/caissier).
 *  Différences vs. createReservationValidator :
 *  - pas de restriction "date future" (l'admin peut saisir des réservations passées)
 *  - status initial configurable (défaut : confirmed)
 *  - notes internes incluses
 */
export const adminCreateReservationValidator = vine.compile(
  vine.object({
    customerName:    vine.string().trim().minLength(2).maxLength(255),
    customerPhone:   vine.string().trim().minLength(4).maxLength(50),
    customerEmail:   vine.string().trim().email().maxLength(255).optional().nullable(),
    reservedDate:    vine.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    reservedTime:    vine.string().regex(/^\d{2}:\d{2}$/),
    guestsCount:     vine.number().min(1).max(200),
    specialRequests: vine.string().trim().maxLength(1000).optional().nullable(),
    notes:           vine.string().trim().maxLength(1000).optional().nullable(),
    status:          vine.enum(['pending', 'confirmed'] as const).optional(),
  })
)
