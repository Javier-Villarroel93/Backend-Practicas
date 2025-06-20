const { body, validationResult } = require("express-validator")
const User = require("../models/sql/User")
const UserDetails = require("../models/mongodb/UserDetails")
const { decryptFields } = require("../middleware/encryption")
const logger = require("../config/logger")

const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password_hash"] },
    })

    const decryptedUsers = users.map((user) => {
      const userData = decryptFields(user.dataValues, ["encrypted_name", "encrypted_email"])
      return {
        id: user.id,
        name: userData.encrypted_name,
        email: userData.encrypted_email,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at,
      }
    })

    res.json({
      success: true,
      data: decryptedUsers,
      message: "Usuarios obtenidos exitosamente",
    })
  } catch (error) {
    logger.error("Error al obtener usuarios:", error)
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      code: "INTERNAL_SERVER_ERROR",
    })
  }
}

const createUser = async (req, res) => {
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

    const { name, email, password, role } = req.body

    // Verificar si el email ya existe
    const users = await User.findAll()
    const existingUser = users.find((u) => {
      const decryptedUser = decryptFields(u.dataValues, ["encrypted_email"])
      return decryptedUser.encrypted_email === email
    })

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "El email ya está registrado",
        code: "EMAIL_EXISTS",
      })
    }

    const user = await User.create({
      encrypted_name: name,
      encrypted_email: email,
      password_hash: password,
      role,
    })

    // Crear detalles del usuario en MongoDB
    await UserDetails.create({
      userId: user.id,
      preferences: {},
      activityLog: [
        {
          action: "created",
          details: { createdBy: req.user.id },
        },
      ],
    })

    const userData = decryptFields(user.dataValues, ["encrypted_name", "encrypted_email"])

    logger.info(`Usuario creado: ${user.id} por usuario: ${req.user.id}`)

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        name: userData.encrypted_name,
        email: userData.encrypted_email,
        role: user.role,
      },
      message: "Usuario creado exitosamente",
    })
  } catch (error) {
    logger.error("Error al crear usuario:", error)
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      code: "INTERNAL_SERVER_ERROR",
    })
  }
}

const updateUser = async (req, res) => {
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
    const { name, email, role } = req.body

    const user = await User.findByPk(id)
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado",
        code: "USER_NOT_FOUND",
      })
    }

    // Verificar si el nuevo email ya existe (si se está cambiando)
    if (email) {
      const users = await User.findAll({ where: { id: { [require("sequelize").Op.ne]: id } } })
      const existingUser = users.find((u) => {
        const decryptedUser = decryptFields(u.dataValues, ["encrypted_email"])
        return decryptedUser.encrypted_email === email
      })

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: "El email ya está registrado",
          code: "EMAIL_EXISTS",
        })
      }
    }

    const updateData = {}
    if (name) updateData.encrypted_name = name
    if (email) updateData.encrypted_email = email
    if (role) updateData.role = role

    await user.update(updateData)

    const userData = decryptFields(user.dataValues, ["encrypted_name", "encrypted_email"])

    logger.info(`Usuario actualizado: ${id} por usuario: ${req.user.id}`)

    res.json({
      success: true,
      data: {
        id: user.id,
        name: userData.encrypted_name,
        email: userData.encrypted_email,
        role: user.role,
      },
      message: "Usuario actualizado exitosamente",
    })
  } catch (error) {
    logger.error("Error al actualizar usuario:", error)
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      code: "INTERNAL_SERVER_ERROR",
    })
  }
}

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params

    const user = await User.findByPk(id)
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado",
        code: "USER_NOT_FOUND",
      })
    }

    // No permitir que un usuario se elimine a sí mismo
    if (Number.parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        error: "No puedes eliminar tu propia cuenta",
        code: "CANNOT_DELETE_SELF",
      })
    }

    await user.destroy()

    // Eliminar detalles del usuario en MongoDB
    await UserDetails.deleteOne({ userId: Number.parseInt(id) })

    logger.info(`Usuario eliminado: ${id} por usuario: ${req.user.id}`)

    res.json({
      success: true,
      message: "Usuario eliminado exitosamente",
    })
  } catch (error) {
    logger.error("Error al eliminar usuario:", error)
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      code: "INTERNAL_SERVER_ERROR",
    })
  }
}

// Validaciones
const createUserValidation = [
  body("name").notEmpty().withMessage("El nombre es requerido"),
  body("email").isEmail().withMessage("Email inválido"),
  body("password").isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres"),
  body("role").isIn(["Administrador", "Veterinario", "Recepcionista"]).withMessage("Rol inválido"),
]

const updateUserValidation = [
  body("name").optional().notEmpty().withMessage("El nombre no puede estar vacío"),
  body("email").optional().isEmail().withMessage("Email inválido"),
  body("role").optional().isIn(["Administrador", "Veterinario", "Recepcionista"]).withMessage("Rol inválido"),
]

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  createUserValidation,
  updateUserValidation,
}
