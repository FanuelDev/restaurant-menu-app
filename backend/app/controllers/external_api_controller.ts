// backend/app/controllers/external_api_controller.ts
// API REST v1 — accessible via clé API (plan Enterprise).
// Toutes les routes sont préfixées /api/v1/ et passent par ApiKeyMiddleware.

import vine from '@vinejs/vine'
import type { HttpContext } from '@adonisjs/core/http'
import Category from '#models/category'
import MenuItem from '#models/menu_item'
import Order from '#models/order'
import OrderItem from '#models/order_item'
import Reservation from '#models/reservation'
import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'

// ── Validators ────────────────────────────────────────────────────────────────

const createOrderV = vine.compile(
  vine.object({
    customerName:  vine.string().trim().minLength(1).maxLength(255),
    customerPhone: vine.string().trim().minLength(1).maxLength(50).optional(),
    customerEmail: vine.string().trim().email().optional(),
    notes:         vine.string().trim().maxLength(1000).optional(),
    items: vine.array(
      vine.object({
        menuItemId: vine.number().positive(),
        quantity:   vine.number().positive().max(100),
        specialInstructions: vine.string().trim().maxLength(500).optional(),
      })
    ).minLength(1),
  })
)

const createReservationV = vine.compile(
  vine.object({
    customerName:    vine.string().trim().minLength(1).maxLength(255),
    customerPhone:   vine.string().trim().minLength(1).maxLength(50),
    customerEmail:   vine.string().trim().email().optional(),
    reservedDate:    vine.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    reservedTime:    vine.string().regex(/^\d{2}:\d{2}$/),
    guestsCount:     vine.number().positive().max(500),
    specialRequests: vine.string().trim().maxLength(1000).optional(),
  })
)

// ── Helpers ───────────────────────────────────────────────────────────────────

function serializeMenuItem(item: MenuItem) {
  return {
    id:          item.id,
    categoryId:  item.categoryId,
    name:        item.name,
    description: item.description,
    price:       item.price,
    currency:    (item as any).restaurant?.currency ?? 'XOF',
    imageUrl:    item.imageUrl,
    isAvailable: item.isAvailable,
    badge:       item.badge,
    sortOrder:   item.sortOrder,
  }
}

function serializeOrder(order: Order) {
  return {
    id:            order.id,
    orderNumber:   order.orderNumber,
    customerName:  order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail,
    status:        order.status,
    total:         order.total,
    notes:         order.notes,
    createdAt:     order.createdAt.toISO(),
    items: (order.items ?? []).map((i: OrderItem) => ({
      id:           i.id,
      menuItemName: i.menuItemName,
      menuItemPrice: i.menuItemPrice,
      quantity:     i.quantity,
      subtotal:     i.subtotal,
      specialInstructions: i.specialInstructions,
    })),
  }
}

function serializeReservation(r: Reservation) {
  return {
    id:              r.id,
    customerName:    r.customerName,
    customerPhone:   r.customerPhone,
    customerEmail:   r.customerEmail,
    reservedDate:    r.reservedDate,
    reservedTime:    r.reservedTime,
    guestsCount:     r.guestsCount,
    specialRequests: r.specialRequests,
    status:          r.status,
    notes:           r.notes,
    createdAt:       r.createdAt.toISO(),
  }
}

// ── Controller ────────────────────────────────────────────────────────────────

export default class ExternalApiController {

  // ── GET /api/v1/restaurant ────────────────────────────────────────────────

  async getRestaurant({ restaurant, response }: HttpContext) {
    await restaurant.load('plan')
    return response.ok({
      id:       restaurant.id,
      slug:     restaurant.slug,
      name:     restaurant.name,
      slogan:   restaurant.slogan,
      address:  restaurant.address,
      phone:    restaurant.phone,
      email:    restaurant.email,
      website:  restaurant.website,
      country:  restaurant.country,
      currency: restaurant.currency,
      brandColor: restaurant.brandColor,
      openingHours: restaurant.openingHours,
      plan: restaurant.plan ? { name: restaurant.plan.name, slug: restaurant.plan.slug } : null,
    })
  }

  // ── GET /api/v1/menu ──────────────────────────────────────────────────────

  async getMenu({ restaurant, response }: HttpContext) {
    const categories = await Category.query()
      .where('restaurant_id', restaurant.id)
      .where('is_visible', true)
      .preload('menuItems', (q) =>
        q.where('is_available', true).orderBy('sort_order', 'asc')
      )
      .orderBy('sort_order', 'asc')

    return response.ok(
      categories.map((cat) => ({
        id:          cat.id,
        name:        cat.name,
        description: cat.description,
        sortOrder:   cat.sortOrder,
        items:       cat.menuItems.map(serializeMenuItem),
      }))
    )
  }

  // ── GET /api/v1/menu/items ────────────────────────────────────────────────

  async getMenuItems({ restaurant, request, response }: HttpContext) {
    const categoryId = request.input('categoryId')
    const q = MenuItem.query()
      .where('restaurant_id', restaurant.id)
      .where('is_available', true)
      .orderBy('sort_order', 'asc')

    if (categoryId) q.where('category_id', categoryId)

    const items = await q
    return response.ok(items.map(serializeMenuItem))
  }

  // ── GET /api/v1/orders ────────────────────────────────────────────────────

  async getOrders({ restaurant, request, response }: HttpContext) {
    const page    = Math.max(1, Number(request.input('page', 1)))
    const perPage = Math.min(100, Math.max(1, Number(request.input('perPage', 20))))
    const status  = request.input('status')

    const q = Order.query()
      .where('restaurant_id', restaurant.id)
      .preload('items')
      .orderBy('created_at', 'desc')

    if (status) q.where('status', status)

    const result = await q.paginate(page, perPage)
    const meta   = result.getMeta()

    return response.ok({
      data: result.all().map(serializeOrder),
      meta: {
        total:       meta.total,
        perPage:     meta.perPage,
        currentPage: meta.currentPage,
        lastPage:    meta.lastPage,
      },
    })
  }

  // ── GET /api/v1/orders/:orderNumber ──────────────────────────────────────

  async getOrder({ restaurant, params, response }: HttpContext) {
    const order = await Order.query()
      .where('restaurant_id', restaurant.id)
      .where('order_number', params.orderNumber)
      .preload('items')
      .firstOrFail()

    return response.ok(serializeOrder(order))
  }

  // ── POST /api/v1/orders ───────────────────────────────────────────────────

  async createOrder({ restaurant, request, response }: HttpContext) {
    const data = await request.validateUsing(createOrderV)

    let total = 0
    const orderItems: { menuItem: MenuItem; qty: number; instructions: string }[] = []

    for (const line of data.items) {
      const item = await MenuItem.query()
        .where('id', line.menuItemId)
        .where('restaurant_id', restaurant.id)
        .where('is_available', true)
        .firstOrFail()
      total += item.price * line.quantity
      orderItems.push({ menuItem: item, qty: line.quantity, instructions: line.specialInstructions ?? '' })
    }

    const order = await Order.create({
      restaurantId:  restaurant.id,
      orderNumber:   `ORD-${Date.now()}-${randomUUID().slice(0, 4).toUpperCase()}`,
      customerName:  data.customerName,
      customerPhone: data.customerPhone ?? null,
      customerEmail: data.customerEmail ?? null,
      notes:         data.notes ?? null,
      status:        'pending',
      total,
      isGift:        false,
    })

    for (const line of orderItems) {
      await OrderItem.create({
        orderId:             order.id,
        menuItemId:          line.menuItem.id,
        menuItemName:        line.menuItem.name,
        menuItemPrice:       line.menuItem.price,
        quantity:            line.qty,
        specialInstructions: line.instructions,
        subtotal:            line.menuItem.price * line.qty,
      })
    }

    await order.load('items')
    return response.created(serializeOrder(order))
  }

  // ── GET /api/v1/reservations ──────────────────────────────────────────────

  async getReservations({ restaurant, request, response }: HttpContext) {
    const page    = Math.max(1, Number(request.input('page', 1)))
    const perPage = Math.min(100, Math.max(1, Number(request.input('perPage', 20))))
    const status  = request.input('status')
    const date    = request.input('date')

    const q = Reservation.query()
      .where('restaurant_id', restaurant.id)
      .orderBy('reserved_date', 'desc')
      .orderBy('reserved_time', 'desc')

    if (status) q.where('status', status)
    if (date)   q.where('reserved_date', date)

    const result = await q.paginate(page, perPage)
    const meta   = result.getMeta()

    return response.ok({
      data: result.all().map(serializeReservation),
      meta: {
        total:       meta.total,
        perPage:     meta.perPage,
        currentPage: meta.currentPage,
        lastPage:    meta.lastPage,
      },
    })
  }

  // ── POST /api/v1/reservations ─────────────────────────────────────────────

  async createReservation({ restaurant, request, response }: HttpContext) {
    const data = await request.validateUsing(createReservationV)

    const reservation = await Reservation.create({
      restaurantId:    restaurant.id,
      customerName:    data.customerName,
      customerPhone:   data.customerPhone,
      customerEmail:   data.customerEmail ?? null,
      reservedDate:    data.reservedDate,
      reservedTime:    data.reservedTime,
      guestsCount:     data.guestsCount,
      specialRequests: data.specialRequests ?? null,
      status:          'pending',
    })

    return response.created(serializeReservation(reservation))
  }
}
