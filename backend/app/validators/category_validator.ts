// backend/app/validators/category_validator.ts
import vine from '@vinejs/vine'

export const createCategoryValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(255),
    description: vine.string().trim().maxLength(512).optional(),
    sortOrder: vine.number().min(0).optional(),
    isVisible: vine.boolean().optional(),
  })
)

export const updateCategoryValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(255).optional(),
    description: vine.string().trim().maxLength(512).optional().nullable(),
    sortOrder: vine.number().min(0).optional(),
    isVisible: vine.boolean().optional(),
  })
)

export const reorderCategoriesValidator = vine.compile(
  vine.object({
    // Tableau d'objets { id, sortOrder } définissant le nouvel ordre
    items: vine.array(
      vine.object({
        id: vine.number().positive(),
        sortOrder: vine.number().min(0),
      })
    ),
  })
)
