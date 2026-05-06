import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Order from '#models/order'
import OrderItem from '#models/order_item'
import MenuItem from '#models/menu_item'
import { createOrderValidator, updateOrderStatusValidator } from '#validators/order_validator'
import vine from '@vinejs/vine'

const redeemValidator = vine.compile(
  vine.object({
    redeemerName: vine.string().trim().minLength(1).maxLength(255),
    redeemerContact: vine.string().trim().minLength(1).maxLength(255),
  })
)

export default class OrdersController {
  /** GET /api/public/features */
  async featureCheck({ restaurant, response }: HttpContext) {
    await restaurant.load('plan')
    const plan = restaurant.plan
    return response.ok({
      ordersAndReservations:
        plan?.features?.['orders_and_reservations'] === true || plan?.slug === 'enterprise',
    })
  }

  /** POST /api/public/orders */
  async store({ request, response, restaurant }: HttpContext) {
    const data = await request.validateUsing(createOrderValidator)

    // Load and validate each menu item
    const menuItems: MenuItem[] = []
    for (const item of data.items) {
      const menuItem = await MenuItem.query()
        .where('id', item.menuItemId)
        .where('restaurant_id', restaurant.id)
        .where('is_available', true)
        .first()

      if (!menuItem) {
        return response.unprocessableEntity({
          error: `Menu item ${item.menuItemId} not found or unavailable`,
        })
      }
      menuItems.push(menuItem)
    }

    // Calculate subtotals and total
    let totalInCents = 0
    const itemsData = data.items.map((item, index) => {
      const menuItem = menuItems[index]
      const subtotalInCents = menuItem.priceInCents * item.quantity
      totalInCents += subtotalInCents
      return {
        menuItemId: menuItem.id,
        menuItemName: menuItem.name,
        menuItemPriceInCents: menuItem.priceInCents,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions ?? null,
        subtotalInCents,
      }
    })

    const orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`
    const giftToken = data.isGift ? randomUUID() : null

    const order = await db.transaction(async (trx) => {
      const newOrder = await Order.create(
        {
          restaurantId: restaurant.id,
          orderNumber,
          customerName: data.customerName,
          customerPhone: data.customerPhone ?? null,
          customerEmail: data.customerEmail ?? null,
          notes: data.notes ?? null,
          totalInCents,
          isGift: data.isGift ?? false,
          giftMessage: data.giftMessage ?? null,
          giftToken,
          status: 'pending',
        },
        { client: trx }
      )

      for (const itemData of itemsData) {
        const orderItem = new OrderItem()
        orderItem.fill({ ...itemData, orderId: newOrder.id })
        orderItem.useTransaction(trx)
        await orderItem.save()
      }

      return newOrder
    })

    await order.load('items')
    return response.created(order.serialize())
  }

  /** GET /api/public/orders/:orderNumber */
  async show({ params, response, restaurant }: HttpContext) {
    const order = await Order.query()
      .where('order_number', params.orderNumber)
      .where('restaurant_id', restaurant.id)
      .preload('items')
      .firstOrFail()

    return response.ok(order.serialize())
  }

  /** GET /api/public/redeem/:token */
  async redeemInfo({ params, response, restaurant }: HttpContext) {
    const order = await Order.query()
      .where('gift_token', params.token)
      .where('restaurant_id', restaurant.id)
      .preload('items')
      .first()

    if (!order) {
      return response.notFound({ error: 'Gift not found' })
    }

    if (order.giftRevokedAt) {
      return response.gone({ error: 'gift_revoked' })
    }

    if (order.giftRedeemedAt) {
      return response.ok({ order: order.serialize(), alreadyRedeemed: true })
    }

    return response.ok({
      order: order.serialize(),
      alreadyRedeemed: false,
      restaurantName: restaurant.name,
    })
  }

  /** POST /api/public/redeem/:token */
  async redeem({ params, request, response, restaurant }: HttpContext) {
    const order = await Order.query()
      .where('gift_token', params.token)
      .where('restaurant_id', restaurant.id)
      .first()

    if (!order) {
      return response.notFound({ error: 'Gift not found' })
    }

    if (order.giftRevokedAt) {
      return response.gone({ error: 'gift_revoked' })
    }

    if (order.giftRedeemedAt) {
      return response.conflict({ error: 'Gift already redeemed' })
    }

    const { redeemerName, redeemerContact } = await request.validateUsing(redeemValidator)

    order.giftRedeemedAt = DateTime.now()
    order.giftRedeemedBy = redeemerName
    order.giftRedeemedContact = redeemerContact
    await order.save()

    return response.ok(order.serialize())
  }

  /** GET /api/admin/orders */
  async adminIndex({ request, response, restaurant }: HttpContext) {
    const page = Number(request.input('page', 1))
    const perPage = Number(request.input('perPage', 20))
    const status = request.input('status')
    const isGift = request.input('isGift')
    const search = request.input('search')

    let query = Order.query()
      .where('restaurant_id', restaurant.id)
      .preload('items')
      .orderBy('created_at', 'desc')

    if (status) {
      query = query.where('status', status)
    }

    if (isGift !== undefined && isGift !== null && isGift !== '') {
      const isGiftBool = isGift === 'true' || isGift === '1'
      query = query.where('is_gift', isGiftBool)
    }

    if (search) {
      query = query.where((q) => {
        q.whereILike('customer_name', `%${search}%`).orWhereILike('order_number', `%${search}%`)
      })
    }

    const orders = await query.paginate(page, perPage)
    return response.ok(orders.serialize())
  }

  /** PATCH /api/admin/orders/:id/status */
  async adminUpdateStatus({ params, request, response, restaurant }: HttpContext) {
    const order = await Order.query()
      .where('id', params.id)
      .where('restaurant_id', restaurant.id)
      .firstOrFail()

    const { status } = await request.validateUsing(updateOrderStatusValidator)
    order.status = status
    await order.save()

    return response.ok(order.serialize())
  }

  /** POST /api/admin/orders/:id/revoke-gift */
  async adminRevokeGift({ params, response, restaurant }: HttpContext) {
    const order = await Order.query()
      .where('id', params.id)
      .where('restaurant_id', restaurant.id)
      .firstOrFail()

    if (!order.isGift) {
      return response.badRequest({ error: 'Order is not a gift' })
    }

    if (order.giftRevokedAt) {
      return response.badRequest({ error: 'Gift already revoked' })
    }

    order.giftRevokedAt = DateTime.now()
    await order.save()

    return response.ok(order.serialize())
  }

  /** GET /api/admin/orders/scan/:token */
  async adminScanToken({ params, response, restaurant }: HttpContext) {
    const order = await Order.query()
      .where('gift_token', params.token)
      .where('restaurant_id', restaurant.id)
      .preload('items')
      .first()

    if (!order) {
      return response.notFound({ error: 'Gift not found' })
    }

    return response.ok(order.serialize())
  }
}
