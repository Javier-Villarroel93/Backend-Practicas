const { body, validationResult } = require("express-validator")
const Owner = require("../models/sql/Owner")
const Pet = require("../models/sql/Pet")
const { decryptFields } = require("../middleware/encryption")
const logger = require("../config/logger")

const getAllOwners = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query

    const offset = (page - 1) * limit
    const owners = await Owner.findAndCountAll({
      limit: Number.parseInt(limit),
      offset: Number.parseInt(offset),
      order: [["created_at", "DESC"]],
    })

    let decryptedOwners = owners.rows.map((owner) => {
      const ownerData = decryptFields(owner.dataValues, ["encrypted_name", "encrypted_email", "encrypted_phone"])
      return {
        id: owner.id,
        name: ownerData.encrypted_name,
        email: ownerData.encrypted_email,
        phone: ownerData.encrypted_phone,
        created_at: owner.created_at,
      }
    })

    // Filtrar por búsqueda si se proporciona
    if (search) {
      decryptedOwners = decryptedOwners.filter(
        (owner) =>
          owner.name.toLowerCase().includes(search.toLowerCase()) ||
          owner.email.toLowerCase().includes(search.toLowerCase()) ||
          owner.phone.includes(search),
      )
    }

    res.json({
      success: true,
      data: {
        owners: decryptedOwners,
        pagination: {
          total: owners.count,
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          totalPages: Math.ceil(owners.count / limit),
        },
      },
      message: "Propietarios obtenidos exitosamente",
    })
  } catch (error) {
    logger.error("Error al obtener propietarios:", error)
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      code: "INTERNAL_SERVER_ERROR",
    })
  }
}

const createOwner = async (req, res) => {
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

    const { name, email, phone } = req.body

    const owner = await Owner.create({
      encrypted_name: name,
      encrypted_email: email,
      encrypted_phone: phone,
    })

    const ownerData = decryptFields(owner.dataValues, ["encrypted_name", "encrypted_email", "encrypted_phone"])

    logger.info(`Propietario creado: ${owner.id} por usuario: ${req.user.id}`)

    res.status(201).json({
      success: true,
      data: {
        id: owner.id,
        name: ownerData.encrypted_name,
        email: ownerData.encrypted_email,
        phone: ownerData.encrypted_phone,
        created_at: owner.created_at,
      },
      message: "Propietario creado exitosamente",
    })
  } catch (error) {
    logger.error("Error al crear propietario:", error)
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      code: "INTERNAL_SERVER_ERROR",
    })
  }
}

const updateOwner = async (req, res) => {
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
    const { name, email, phone } = req.body

    const owner = await Owner.findByPk(id)
    if (!owner) {
      return res.status(404).json({
        success: false,
        error: "Propietario no encontrado",
        code: "OWNER_NOT_FOUND",
      })
    }

    const updateData = {}
    if (name) updateData.encrypted_name = name
    if (email) updateData.encrypted_email = email
    if (phone) updateData.encrypted_phone = phone

    await owner.update(updateData)

    const ownerData = decryptFields(owner.dataValues, ["encrypted_name", "encrypted_email", "encrypted_phone"])

    logger.info(`Propietario actualizado: ${id} por usuario: ${req.user.id}`)

    res.json({
      success: true,
      data: {
        id: owner.id,
        name: ownerData.encrypted_name,
        email: ownerData.encrypted_email,
        phone: ownerData.encrypted_phone,
        created_at: owner.created_at,
      },
      message: "Propietario actualizado exitosamente",
    })
  } catch (error) {
    logger.error("Error al actualizar propietario:", error)
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      code: "INTERNAL_SERVER_ERROR",
    })
  }
}

const deleteOwner = async (req, res) => {
  try {
    const { id } = req.params

    const owner = await Owner.findByPk(id)
    if (!owner) {
      return res.status(404).json({
        success: false,
        error: "Propietario no encontrado",
        code: "OWNER_NOT_FOUND",
      })
    }

    // Verificar si tiene mascotas asociadas
    const pets = await Pet.findAll({ where: { owner_id: id } })
    if (pets.length > 0) {
      return res.status(400).json({
        success: false,
        error: "No se puede eliminar el propietario porque tiene mascotas asociadas",
        code: "OWNER_HAS_PETS",
      })
    }

    await owner.destroy()

    logger.info(`Propietario eliminado: ${id} por usuario: ${req.user.id}`)

    res.json({
      success: true,
      message: "Propietario eliminado exitosamente",
    })
  } catch (error) {
    logger.error("Error al eliminar propietario:", error)
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      code: "INTERNAL_SERVER_ERROR",
    })
  }
}

const getOwnerPets = async (req, res) => {
  try {
    const { id } = req.params

    const owner = await Owner.findByPk(id)
    if (!owner) {
      return res.status(404).json({
        success: false,
        error: "Propietario no encontrado",
        code: "OWNER_NOT_FOUND",
      })
    }

    const pets = await Pet.findAll({
      where: { owner_id: id },
      order: [["created_at", "DESC"]],
    })

    const decryptedPets = pets.map((pet) => {
      const petData = decryptFields(pet.dataValues, ["encrypted_name"])
      return {
        id: pet.id,
        name: petData.encrypted_name,
        breed: pet.breed,
        age: pet.age,
        health_status: pet.health_status,
        created_at: pet.created_at,
      }
    })

    res.json({
      success: true,
      data: decryptedPets,
      message: "Mascotas del propietario obtenidas exitosamente",
    })
  } catch (error) {
    logger.error("Error al obtener mascotas del propietario:", error)
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      code: "INTERNAL_SERVER_ERROR",
    })
  }
}

// Validaciones
const createOwnerValidation = [
  body("name").notEmpty().withMessage("El nombre es requerido"),
  body("email").isEmail().withMessage("Email inválido"),
  body("phone").notEmpty().withMessage("El teléfono es requerido"),
]

const updateOwnerValidation = [
  body("name").optional().notEmpty().withMessage("El nombre no puede estar vacío"),
  body("email").optional().isEmail().withMessage("Email inválido"),
  body("phone").optional().notEmpty().withMessage("El teléfono no puede estar vacío"),
]

module.exports = {
  getAllOwners,
  createOwner,
  updateOwner,
  deleteOwner,
  getOwnerPets,
  createOwnerValidation,
  updateOwnerValidation,
}
