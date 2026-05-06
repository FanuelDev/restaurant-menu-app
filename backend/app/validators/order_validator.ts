import vine from '@vinejs/vine'

export const createOrderValidator = vine.compile(
  vine.object({
    customerName: vine.string().trim().minLength(2).maxLength(255),
    customerPhone: vine.string().trim().maxLength(50).optional().nullable(),
    customerEmail: vine.string().trim().email().maxLength(255).optional().nullable(),
    notes: vine.string().trim().maxLength(1000).optional().nullable(),
    isGift: vine.boolean().optional(),
    giftMessage: vine.string().trim().maxLength(500).optional().nullable(),
    items: vine
      .array(
        vine.object({
          menuItemId: vine.number().positive(),
          quantity: vine.number().min(1).max(99),
          specialInstructions: vine.string().trim().maxLength(500).optional().nullable(),
        })
      )
      .minLength(1),
  })
)

export const updateOrderStatusValidator = vine.compile(
  vine.object({
    status: vine.enum(['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'] as const),
  })
)
