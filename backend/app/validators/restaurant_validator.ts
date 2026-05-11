// backend/app/validators/restaurant_validator.ts
import vine from '@vinejs/vine'

const daySchedule = vine.object({
  open: vine.string().regex(/^\d{2}:\d{2}$/),
  close: vine.string().regex(/^\d{2}:\d{2}$/),
  closed: vine.boolean().optional(),
})

export const updateRestaurantValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(255).optional(),
    templateId: vine.number().min(1).max(3).optional(),
    slogan: vine.string().trim().maxLength(512).optional().nullable(),
    brandColor: vine
      .string()
      .trim()
      .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)
      .optional(),
    address: vine.string().trim().maxLength(512).optional().nullable(),
    phone: vine.string().trim().maxLength(20).optional().nullable(),
    email: vine.string().trim().email().optional().nullable(),
    openingHours: vine
      .object({
        monday: daySchedule.optional(),
        tuesday: daySchedule.optional(),
        wednesday: daySchedule.optional(),
        thursday: daySchedule.optional(),
        friday: daySchedule.optional(),
        saturday: daySchedule.optional(),
        sunday: daySchedule.optional(),
      })
      .optional()
      .nullable(),
  })
)
