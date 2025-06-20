const { body, validationResult } = require("express-validator")
const Service = require("../models/mongodb/Service")
const logger = require("../config/logger")

const getAllServices = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, active } = req.query

    const offset = (page - 1) * limit
    const filter = {}

    if (active !== undefined) {
      filter.active = active === "true"
    }

    if (search) {
      filter.$or = [{ name: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }]
    }

    const services = await Service.find(filter)
      .limit(Number.parseInt(limit))
      .skip(Number.parseInt(offset))
      .sort({ createdAt: -1 })

    const total = await Service.countDocuments(filter)

    res.json({
      success: true,
      data: {
        services,
        pagination: {
          total,
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          totalPages: Math.ceil(total / limit),
        },
      },
      message: "Servicios obtenidos exitosamente",
    })
  } catch (error) {
    logger.error("Error al obtener servicios:", error)
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      code: "INTERNAL_SERVER_ERROR",
    })
  }
}

const createService = async (req, res) => {
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

    const { name, description, image, subcategories, active = true } = req.body

    const service = new Service({
      name,
      description,
      image,
      subcategories: subcategories || [],
      active,
    })

    await service.save()

    logger.info(`Servicio creado: ${service._id} por usuario: ${req.user.id}`)

    res.status(201).json({
      success: true,
      data: service,
      message: "Servicio creado exitosamente",
    })
  } catch (error) {
    logger.error("Error al crear servicio:", error)
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      code: "INTERNAL_SERVER_ERROR",
    })
  }
}

const updateService = async (req, res) => {
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
    const { name, description, image, subcategories, active } = req.body

    const service = await Service.findById(id)
    if (!service) {
      return res.status(404).json({
        success: false,
        error: "Servicio no encontrado",
        code: "SERVICE_NOT_FOUND",
      })
    }

    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (image !== undefined) updateData.image = image
    if (subcategories !== undefined) updateData.subcategories = subcategories
    if (active !== undefined) updateData.active = active

    const updatedService = await Service.findByIdAndUpdate(id, updateData, { new: true })

    logger.info(`Servicio actualizado: ${id} por usuario: ${req.user.id}`)

    res.json({
      success: true,
      data: updatedService,
      message: "Servicio actualizado exitosamente",
    })
  } catch (error) {
    logger.error("Error al actualizar servicio:", error)
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      code: "INTERNAL_SERVER_ERROR",
    })
  }
}

const deleteService = async (req, res) => {
  try {
    const { id } = req.params

    const service = await Service.findById(id)
    if (!service) {
      return res.status(404).json({
        success: false,
        error: "Servicio no encontrado",
        code: "SERVICE_NOT_FOUND",
      })
    }

    await Service.findByIdAndDelete(id)

    logger.info(`Servicio eliminado: ${id} por usuario: ${req.user.id}`)

    res.json({
      success: true,
      message: "Servicio eliminado exitosamente",
    })
  } catch (error) {
    logger.error("Error al eliminar servicio:", error)
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      code: "INTERNAL_SERVER_ERROR",
    })
  }
}

// Validaciones
const createServiceValidation = [
  body("name").notEmpty().withMessage("El nombre es requerido"),
  body("description").notEmpty().withMessage("La descripción es requerida"),
  body("image").optional().isURL().withMessage("La imagen debe ser una URL válida"),
  body("subcategories").optional().isArray().withMessage("Las subcategorías deben ser un array"),
  body("subcategories.*.id").notEmpty().withMessage("El ID de subcategoría es requerido"),
  body("subcategories.*.name").notEmpty().withMessage("El nombre de subcategoría es requerido"),
  body("subcategories.*.price").isNumeric().withMessage("El precio de subcategoría debe ser numérico"),
  body("active").optional().isBoolean().withMessage("Active debe ser un booleano"),
]

const updateServiceValidation = [
  body("name").optional().notEmpty().withMessage("El nombre no puede estar vacío"),
  body("description").optional().notEmpty().withMessage("La descripción no puede estar vacía"),
  body("image").optional().isURL().withMessage("La imagen debe ser una URL válida"),
  body("subcategories").optional().isArray().withMessage("Las subcategorías deben ser un array"),
  body("active").optional().isBoolean().withMessage("Active debe ser un booleano"),
]

module.exports = {
  getAllServices,
  createService,
  updateService,
  deleteService,
  createServiceValidation,
  updateServiceValidation,
}
