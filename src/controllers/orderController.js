const { body, validationResult } = require("express-validator")
const { sequelize } = require("../config/database.sql")
const Order = require("../models/sql/Order")
const Owner = require("../models/sql/Owner")
const OrderDetails = require("../models/mongodb/OrderDetails")
const Product = require("../models/mongodb/Product")
const { decryptFields } = require("../middleware/encryption")
const logger = require("../config/logger")

const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, payment_status } = req.query

    const offset = (page - 1) * limit
    const whereClause = {}

    if (status) {
      whereClause.fulfillment_status = status
    }

    if (payment_status) {
      whereClause.payment_status = payment_status
    }

    const orders = await Order.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Owner,
          as: "client",
          attributes: ["id", "encrypted_name", "encrypted_email"],
        },
      ],
      limit: Number.parseInt(limit),
      offset: Number.parseInt(offset),
      order: [["order_date", "DESC"]],
    })

    const ordersWithDetails = await Promise.all(
      orders.rows.map(async (order) => {
        const clientData = order.client
          ? decryptFields(order.client.dataValues, ["encrypted_name", "encrypted_email"])
          : null

        const orderDetails = await OrderDetails.findOne({ orderId: order.id })

        return {
          id: order.id,
          client: clientData
            ? {
                id: order.client.id,
                name: clientData.encrypted_name,
                email: clientData.encrypted_email,
              }
            : null,
          total: order.total,
          payment_status: order.payment_status,
          fulfillment_status: order.fulfillment_status,
          order_date: order.order_date,
          products: orderDetails?.products || [],
          notes: orderDetails?.notes || "",
        }
      }),
    )

    res.json({
      success: true,
      data: {
        orders: ordersWithDetails,
        pagination: {
          total: orders.count,
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          totalPages: Math.ceil(orders.count / limit),
        },
      },
      message: "Órdenes obtenidas exitosamente",
    })
  } catch (error) {
    logger.error("Error al obtener órdenes:", error)
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      code: "INTERNAL_SERVER_ERROR",
    })
  }
}

const createOrder = async (req, res) => {
  const transaction = await sequelize.transaction()

  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      await transaction.rollback()
      return res.status(400).json({
        success: false,
        error: "Datos de entrada inválidos",
        code: "VALIDATION_ERROR",
        details: errors.array(),
      })
    }

    const { client_id, products, notes, payment_status = "Pendiente" } = req.body

    // Verificar que el cliente existe
    if (client_id) {
      const client = await Owner.findByPk(client_id)
      if (!client) {
        await transaction.rollback()
        return res.status(404).json({
          success: false,
          error: "Cliente no encontrado",
          code: "CLIENT_NOT_FOUND",
        })
      }
    }

    // Verificar productos y calcular total
    let total = 0
    const orderProducts = []

    for (const item of products) {
      const product = await Product.findById(item.productId)
      if (!product) {
        await transaction.rollback()
        return res.status(404).json({
          success: false,
          error: `Producto no encontrado: ${item.productId}`,
          code: "PRODUCT_NOT_FOUND",
        })
      }

      if (product.stock < item.quantity) {
        await transaction.rollback()
        return res.status(400).json({
          success: false,
          error: `Stock insuficiente para el producto: ${product.name}`,
          code: "INSUFFICIENT_STOCK",
        })
      }

      const itemTotal = product.price * item.quantity
      total += itemTotal

      orderProducts.push({
        productId: product._id,
        name: product.name,
        quantity: item.quantity,
        price: product.price,
      })

      // Actualizar stock
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity },
      })
    }

    // Crear orden en MySQL
    const order = await Order.create(
      {
        client_id,
        total,
        payment_status,
        fulfillment_status: "En Progreso",
      },
      { transaction },
    )

    // Crear detalles en MongoDB
    await OrderDetails.create({
      orderId: order.id,
      products: orderProducts,
      notes: notes || "",
    })

    await transaction.commit()

    logger.info(`Orden creada: ${order.id} por usuario: ${req.user.id}`)

    res.status(201).json({
      success: true,
      data: {
        id: order.id,
        client_id: order.client_id,
        total: order.total,
        payment_status: order.payment_status,
        fulfillment_status: order.fulfillment_status,
        order_date: order.order_date,
        products: orderProducts,
        notes: notes || "",
      },
      message: "Orden creada exitosamente",
    })
  } catch (error) {
    await transaction.rollback()
    logger.error("Error al crear orden:", error)
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      code: "INTERNAL_SERVER_ERROR",
    })
  }
}

const updateOrder = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: "Datos de entrada inválidos",
        code: "VALIDATION_ERROR",
        details: errors.array(),
      })
    }

    const { id } = req.params
    const { payment_status, fulfillment_status, notes } = req.body

    const order = await Order.findByPk(id)
    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Orden no encontrada",
        code: "ORDER_NOT_FOUND",
      })
    }

    const updateData = {}
    if (payment_status) updateData.payment_status = payment_status
    if (fulfillment_status) updateData.fulfillment_status = fulfillment_status

    await order.update(updateData)

    // Actualizar notas en MongoDB si se proporcionan
    if (notes !== undefined) {
      await OrderDetails.findOneAndUpdate({ orderId: Number.parseInt(id) }, { notes })
    }

    logger.info(`Orden actualizada: ${id} por usuario: ${req.user.id}`)

    res.json({
      success: true,
      data: {
        id: order.id,
        payment_status: order.payment_status,
        fulfillment_status: order.fulfillment_status,
        total: order.total,
        order_date: order.order_date,
      },
      message: "Orden actualizada exitosamente",
    })
  } catch (error) {
    logger.error("Error al actualizar orden:", error)
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      code: "INTERNAL_SERVER_ERROR",
    })
  }
}

const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params

    const order = await Order.findByPk(id, {
      include: [
        {
          model: Owner,
          as: "client",
          attributes: ["id", "encrypted_name", "encrypted_email", "encrypted_phone"],
        },
      ],
    })

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Orden no encontrada",
        code: "ORDER_NOT_FOUND",
      })
    }

    const orderDetails = await OrderDetails.findOne({ orderId: Number.parseInt(id) })

    const clientData = order.client
      ? decryptFields(order.client.dataValues, ["encrypted_name", "encrypted_email", "encrypted_phone"])
      : null

    res.json({
      success: true,
      data: {
        id: order.id,
        client: clientData
          ? {
              id: order.client.id,
              name: clientData.encrypted_name,
              email: clientData.encrypted_email,
              phone: clientData.encrypted_phone,
            }
          : null,
        total: order.total,
        payment_status: order.payment_status,
        fulfillment_status: order.fulfillment_status,
        order_date: order.order_date,
        products: orderDetails?.products || [],
        notes: orderDetails?.notes || "",
      },
      message: "Detalles de orden obtenidos exitosamente",
    })
  } catch (error) {
    logger.error("Error al obtener detalles de orden:", error)
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      code: "INTERNAL_SERVER_ERROR",
    })
  }
}

// Validaciones
const createOrderValidation = [
  body("client_id").optional().isInt().withMessage("ID del cliente debe ser un número"),
  body("products").isArray({ min: 1 }).withMessage("Debe incluir al menos un producto"),
  body("products.*.productId").notEmpty().withMessage("ID del producto es requerido"),
  body("products.*.quantity").isInt({ min: 1 }).withMessage("La cantidad debe ser un número positivo"),
  body("payment_status").optional().isIn(["Pagado", "Pendiente", "No Pagado"]).withMessage("Estado de pago inválido"),
  body("notes").optional().isString().withMessage("Las notas deben ser texto"),
]

const updateOrderValidation = [
  body("payment_status").optional().isIn(["Pagado", "Pendiente", "No Pagado"]).withMessage("Estado de pago inválido"),
  body("fulfillment_status")
    .optional()
    .isIn(["Cumplido", "En Progreso", "No Cumplido"])
    .withMessage("Estado de cumplimiento inválido"),
  body("notes").optional().isString().withMessage("Las notas deben ser texto"),
]

module.exports = {
  getAllOrders,
  createOrder,
  updateOrder,
  getOrderDetails,
  createOrderValidation,
  updateOrderValidation,
}
