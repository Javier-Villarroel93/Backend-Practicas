const { body, validationResult } = require("express-validator")
const Product = require("../models/mongodb/Product")
const logger = require("../config/logger")

const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category, active } = req.query

    const offset = (page - 1) * limit
    const filter = {}

    if (active !== undefined) {
      filter.active = active === "true"
    }

    if (category) {
      filter.category = { $regex: category, $options: "i" }
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ]
    }

    const products = await Product.find(filter)
      .limit(Number.parseInt(limit))
      .skip(Number.parseInt(offset))
      .sort({ createdAt: -1 })

    const total = await Product.countDocuments(filter)

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          total,
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          totalPages: Math.ceil(total / limit),
        },
      },
      message: "Productos obtenidos exitosamente",
    })
  } catch (error) {
    logger.error("Error al obtener productos:", error)
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      code: "INTERNAL_SERVER_ERROR",
    })
  }
}

const createProduct = async (req, res) => {
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

    const { name, description, price, stock, category, image, active = true } = req.body

    const product = new Product({
      name,
      description,
      price,
      stock: stock || 0,
      category,
      image,
      active,
    })

    await product.save()

    logger.info(`Producto creado: ${product._id} por usuario: ${req.user.id}`)

    res.status(201).json({
      success: true,
      data: product,
      message: "Producto creado exitosamente",
    })
  } catch (error) {
    logger.error("Error al crear producto:", error)
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      code: "INTERNAL_SERVER_ERROR",
    })
  }
}

const updateProduct = async (req, res) => {
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
    const { name, description, price, stock, category, image, active } = req.body

    const product = await Product.findById(id)
    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Producto no encontrado",
        code: "PRODUCT_NOT_FOUND",
      })
    }

    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (price !== undefined) updateData.price = price
    if (stock !== undefined) updateData.stock = stock
    if (category !== undefined) updateData.category = category
    if (image !== undefined) updateData.image = image
    if (active !== undefined) updateData.active = active

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true })

    logger.info(`Producto actualizado: ${id} por usuario: ${req.user.id}`)

    res.json({
      success: true,
      data: updatedProduct,
      message: "Producto actualizado exitosamente",
    })
  } catch (error) {
    logger.error("Error al actualizar producto:", error)
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      code: "INTERNAL_SERVER_ERROR",
    })
  }
}

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params

    const product = await Product.findById(id)
    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Producto no encontrado",
        code: "PRODUCT_NOT_FOUND",
      })
    }

    await Product.findByIdAndDelete(id)

    logger.info(`Producto eliminado: ${id} por usuario: ${req.user.id}`)

    res.json({
      success: true,
      message: "Producto eliminado exitosamente",
    })
  } catch (error) {
    logger.error("Error al eliminar producto:", error)
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      code: "INTERNAL_SERVER_ERROR",
    })
  }
}

const updateStock = async (req, res) => {
  try {
    const { id } = req.params
    const { quantity, operation } = req.body // operation: 'add' or 'subtract'

    const product = await Product.findById(id)
    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Producto no encontrado",
        code: "PRODUCT_NOT_FOUND",
      })
    }

    let newStock = product.stock
    if (operation === "add") {
      newStock += quantity
    } else if (operation === "subtract") {
      newStock -= quantity
      if (newStock < 0) {
        return res.status(400).json({
          success: false,
          error: "Stock insuficiente",
          code: "INSUFFICIENT_STOCK",
        })
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, { stock: newStock }, { new: true })

    logger.info(`Stock actualizado para producto: ${id} por usuario: ${req.user.id}`)

    res.json({
      success: true,
      data: updatedProduct,
      message: "Stock actualizado exitosamente",
    })
  } catch (error) {
    logger.error("Error al actualizar stock:", error)
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      code: "INTERNAL_SERVER_ERROR",
    })
  }
}

// Validaciones
const createProductValidation = [
  body("name").notEmpty().withMessage("El nombre es requerido"),
  body("description").notEmpty().withMessage("La descripción es requerida"),
  body("price").isNumeric().withMessage("El precio debe ser numérico"),
  body("stock").optional().isInt({ min: 0 }).withMessage("El stock debe ser un número positivo"),
  body("category").notEmpty().withMessage("La categoría es requerida"),
  body("image").optional().isURL().withMessage("La imagen debe ser una URL válida"),
  body("active").optional().isBoolean().withMessage("Active debe ser un booleano"),
]

const updateProductValidation = [
  body("name").optional().notEmpty().withMessage("El nombre no puede estar vacío"),
  body("description").optional().notEmpty().withMessage("La descripción no puede estar vacía"),
  body("price").optional().isNumeric().withMessage("El precio debe ser numérico"),
  body("stock").optional().isInt({ min: 0 }).withMessage("El stock debe ser un número positivo"),
  body("category").optional().notEmpty().withMessage("La categoría no puede estar vacía"),
  body("image").optional().isURL().withMessage("La imagen debe ser una URL válida"),
  body("active").optional().isBoolean().withMessage("Active debe ser un booleano"),
]

const updateStockValidation = [
  body("quantity").isInt({ min: 1 }).withMessage("La cantidad debe ser un número positivo"),
  body("operation").isIn(["add", "subtract"]).withMessage("Operación debe ser 'add' o 'subtract'"),
]

module.exports = {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  createProductValidation,
  updateProductValidation,
  updateStockValidation,
}
