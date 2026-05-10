// backend/app/validators/menu_item_validator.ts
import vine from '@vinejs/vine'

const VALID_BADGES = ['new', 'popular', 'vegetarian', 'spicy'] as const

export const createMenuItemValidator = vine.compile(
  vine.object({
    categoryId: vine.number().positive(),
    name: vine.string().trim().minLength(1).maxLength(255),
    description: vine.string().trim().maxLength(1000).optional(),
    /** Prix en euros (ex : 12.50) */
    price: vine.number().min(0).max(9999.99),
    isAvailable: vine.boolean().optional(),
    badge: vine.enum(VALID_BADGES).optional().nullable(),
    sortOrder: vine.number().min(0).optional(),
  })
)

export const updateMenuItemValidator = vine.compile(
  vine.object({
    categoryId: vine.number().positive().optional(),
    name: vine.string().trim().minLength(1).maxLength(255).optional(),
    description: vine.string().trim().maxLength(1000).optional().nullable(),
    price: vine.number().min(0).max(9999.99).optional(),
    isAvailable: vine.boolean().optional(),
    badge: vine.enum(VALID_BADGES).optional().nullable(),
    sortOrder: vine.number().min(0).optional(),
  })
)
