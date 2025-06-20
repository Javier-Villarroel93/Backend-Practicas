const { body, validationResult } = require("express-validator")
const Pet = require("../models/sql/Pet")
const Owner = require("../models/sql/Owner")
const PetMedicalHistory = require("../models/mongodb/PetMedicalHistory")
const { decryptFields } = require("../middleware/encryption")
const logger = require("../config/logger")

const getAllPets = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, owner_id } = req.query

    const offset = (page - 1) * limit
    const whereClause = {}

    if (owner_id) {
      whereClause.owner_id = owner_id
    }

    const pets = await Pet.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Owner,
          as: "owner",
          attributes: ["id", "encrypted_name", "encrypted_email"],
        },
      ],
      limit: Number.parseInt(limit),
      offset: Number.parseInt(offset),
      order: [["created_at", "DESC"]],
    })

    let decryptedPets = pets.rows.map((pet) => {
      const petData = decryptFields(pet.dataValues, ["encrypted_name"])
      const ownerData = pet.owner ? decryptFields(pet.owner.dataValues, ["encrypted_name", "encrypted_email"]) : null

      return {
        id: pet.id,
        name: petData.encrypted_name,
        breed: pet.breed,
        age: pet.age,
        health_status: pet.health_status,
        created_at: pet.created_at,
        owner: ownerData
          ? {
              id: pet.owner.id,
              name: ownerData.encrypted_name,
              email: ownerData.encrypted_email,
            }
          : null,
      }
    })

    // Filtrar por búsqueda si se proporciona
    if (search) {
      decryptedPets = decryptedPets.filter(
        (pet) =>
          pet.name.toLowerCase().includes(search.toLowerCase()) ||
          pet.breed?.toLowerCase().includes(search.toLowerCase()) ||
          pet.owner?.name.toLowerCase().includes(search.toLowerCase()),
      )
    }

    res.json({
      success: true,
      data: {
        pets: decryptedPets,
        pagination: {
          total: pets.count,
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          totalPages: Math.ceil(pets.count / limit),
        },
      },
      message: "Mascotas obtenidas exitosamente",
    })
  } catch (error) {
    logger.error("Error al obtener mascotas:", error)
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      code: "INTERNAL_SERVER_ERROR",
    })
  }
}

const createPet = async (req, res) => {
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

    const { name, breed, age, owner_id, health_status } = req.body

    // Verificar que el propietario existe
    if (owner_id) {
      const owner = await Owner.findByPk(owner_id)
      if (!owner) {
        return res.status(404).json({
          success: false,
          error: "Propietario no encontrado",
          code: "OWNER_NOT_FOUND",
        })
      }
    }

    const pet = await Pet.create({
      encrypted_name: name,
      breed,
      age,
      owner_id,
      health_status: health_status || "Saludable",
    })

    // Crear historial médico inicial en MongoDB
    await PetMedicalHistory.create({
      petId: pet.id,
      medicalHistory: [],
      vaccinations: [],
      allergies: [],
    })

    const petData = decryptFields(pet.dataValues, ["encrypted_name"])

    logger.info(`Mascota creada: ${pet.id} por usuario: ${req.user.id}`)

    res.status(201).json({
      success: true,
      data: {
        id: pet.id,
        name: petData.encrypted_name,
        breed: pet.breed,
        age: pet.age,
        owner_id: pet.owner_id,
        health_status: pet.health_status,
        created_at: pet.created_at,
      },
      message: "Mascota creada exitosamente",
    })
  } catch (error) {
    logger.error("Error al crear mascota:", error)
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      code: "INTERNAL_SERVER_ERROR",
    })
  }
}

const updatePet = async (req, res) => {
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
    const { name, breed, age, owner_id, health_status } = req.body

    const pet = await Pet.findByPk(id)
    if (!pet) {
      return res.status(404).json({
        success: false,
        error: "Mascota no encontrada",
        code: "PET_NOT_FOUND",
      })
    }

    // Verificar que el propietario existe si se está cambiando
    if (owner_id && owner_id !== pet.owner_id) {
      const owner = await Owner.findByPk(owner_id)
      if (!owner) {
        return res.status(404).json({
          success: false,
          error: "Propietario no encontrado",
          code: "OWNER_NOT_FOUND",
        })
      }
    }

    const updateData = {}
    if (name) updateData.encrypted_name = name
    if (breed !== undefined) updateData.breed = breed
    if (age !== undefined) updateData.age = age
    if (owner_id !== undefined) updateData.owner_id = owner_id
    if (health_status) updateData.health_status = health_status

    await pet.update(updateData)

    const petData = decryptFields(pet.dataValues, ["encrypted_name"])

    logger.info(`Mascota actualizada: ${id} por usuario: ${req.user.id}`)

    res.json({
      success: true,
      data: {
        id: pet.id,
        name: petData.encrypted_name,
        breed: pet.breed,
        age: pet.age,
        owner_id: pet.owner_id,
        health_status: pet.health_status,
        created_at: pet.created_at,
      },
      message: "Mascota actualizada exitosamente",
    })
  } catch (error) {
    logger.error("Error al actualizar mascota:", error)
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      code: "INTERNAL_SERVER_ERROR",
    })
  }
}

const deletePet = async (req, res) => {
  try {
    const { id } = req.params

    const pet = await Pet.findByPk(id)
    if (!pet) {
      return res.status(404).json({
        success: false,
        error: "Mascota no encontrada",
        code: "PET_NOT_FOUND",
      })
    }

    await pet.destroy()

    // Eliminar historial médico de MongoDB
    await PetMedicalHistory.deleteOne({ petId: Number.parseInt(id) })

    logger.info(`Mascota eliminada: ${id} por usuario: ${req.user.id}`)

    res.json({
      success: true,
      message: "Mascota eliminada exitosamente",
    })
  } catch (error) {
    logger.error("Error al eliminar mascota:", error)
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      code: "INTERNAL_SERVER_ERROR",
    })
  }
}

const getPetMedicalHistory = async (req, res) => {
  try {
    const { id } = req.params

    const pet = await Pet.findByPk(id)
    if (!pet) {
      return res.status(404).json({
        success: false,
        error: "Mascota no encontrada",
        code: "PET_NOT_FOUND",
      })
    }

    const medicalHistory = await PetMedicalHistory.findOne({ petId: Number.parseInt(id) })

    res.json({
      success: true,
      data: medicalHistory || {
        petId: Number.parseInt(id),
        medicalHistory: [],
        vaccinations: [],
        allergies: [],
      },
      message: "Historial médico obtenido exitosamente",
    })
  } catch (error) {
    logger.error("Error al obtener historial médico:", error)
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      code: "INTERNAL_SERVER_ERROR",
    })
  }
}

const addMedicalRecord = async (req, res) => {
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
    const { diagnosis, treatment, observations } = req.body

    const pet = await Pet.findByPk(id)
    if (!pet) {
      return res.status(404).json({
        success: false,
        error: "Mascota no encontrada",
        code: "PET_NOT_FOUND",
      })
    }

    const newRecord = {
      date: new Date(),
      diagnosis,
      treatment,
      observations: observations || "",
      veterinarianId: req.user.id,
    }

    await PetMedicalHistory.findOneAndUpdate(
      { petId: Number.parseInt(id) },
      {
        $push: { medicalHistory: newRecord },
      },
      { upsert: true },
    )

    logger.info(`Registro médico agregado para mascota: ${id} por usuario: ${req.user.id}`)

    res.status(201).json({
      success: true,
      data: newRecord,
      message: "Registro médico agregado exitosamente",
    })
  } catch (error) {
    logger.error("Error al agregar registro médico:", error)
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      code: "INTERNAL_SERVER_ERROR",
    })
  }
}

// Validaciones
const createPetValidation = [
  body("name").notEmpty().withMessage("El nombre es requerido"),
  body("breed").optional().isString().withMessage("La raza debe ser texto"),
  body("age").optional().isInt({ min: 0 }).withMessage("La edad debe ser un número positivo"),
  body("owner_id").optional().isInt().withMessage("ID del propietario debe ser un número"),
  body("health_status").optional().isString().withMessage("El estado de salud debe ser texto"),
]

const updatePetValidation = [
  body("name").optional().notEmpty().withMessage("El nombre no puede estar vacío"),
  body("breed").optional().isString().withMessage("La raza debe ser texto"),
  body("age").optional().isInt({ min: 0 }).withMessage("La edad debe ser un número positivo"),
  body("owner_id").optional().isInt().withMessage("ID del propietario debe ser un número"),
  body("health_status").optional().isString().withMessage("El estado de salud debe ser texto"),
]

const addMedicalRecordValidation = [
  body("diagnosis").notEmpty().withMessage("El diagnóstico es requerido"),
  body("treatment").notEmpty().withMessage("El tratamiento es requerido"),
  body("observations").optional().isString().withMessage("Las observaciones deben ser texto"),
]

module.exports = {
  getAllPets,
  createPet,
  updatePet,
  deletePet,
  getPetMedicalHistory,
  addMedicalRecord,
  createPetValidation,
  updatePetValidation,
  addMedicalRecordValidation,
}
