const jwt = require("jsonwebtoken")
const { body, validationResult } = require("express-validator")
const User = require("../models/sql/User")
const UserDetails = require("../models/mongodb/UserDetails")
const { decryptFields } = require("../middleware/encryption")
const logger = require("../config/logger")

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: decryptFields(user, ["encrypted_email"]).encrypted_email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "24h" },
  )
}

const login = async (req, res) => {
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

    const { email, password } = req.body

    // Buscar usuario por email encriptado
    const users = await User.findAll()
    const user = users.find((u) => {
      const decryptedUser = decryptFields(u.dataValues, ["encrypted_email"])
      return decryptedUser.encrypted_email === email
    })

    if (!user || !(await user.validatePassword(password))) {
      logger.warn(`Intento de login fallido para email: ${email} desde IP: ${req.ip}`)
      return res.status(401).json({
        success: false,
        error: "Credenciales inválidas",
        code: "INVALID_CREDENTIALS",
      })
    }

    // Actualizar último login en MongoDB
    await UserDetails.findOneAndUpdate(
      { userId: user.id },
      {
        lastLogin: new Date(),
        $push: {
          activityLog: {
            action: "login",
            details: { ip: req.ip },
          },
        },
      },
      { upsert: true },
    )

    const token = generateToken(user)
    const userData = decryptFields(user.dataValues, ["encrypted_name", "encrypted_email"])

    logger.info(`Login exitoso para usuario: ${user.id}`)

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: userData.encrypted_name,
          email: userData.encrypted_email,
          role: user.role,
        },
      },
      message: "Login exitoso",
    })
  } catch (error) {
    logger.error("Error en login:", error)
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      code: "INTERNAL_SERVER_ERROR",
    })
  }
}

const register = async (req, res) => {
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

    // Los datos ya vienen encriptados por el middleware
    const user = await User.create({
      encrypted_name: name,
      encrypted_email: email,
      password_hash: password,
      role: role || "Recepcionista",
    })

    // Crear detalles del usuario en MongoDB
    await UserDetails.create({
      userId: user.id,
      preferences: {},
      activityLog: [
        {
          action: "register",
          details: { ip: req.ip },
        },
      ],
    })

    const token = generateToken(user)
    const userData = decryptFields(user.dataValues, ["encrypted_name", "encrypted_email"])

    logger.info(`Nuevo usuario registrado: ${user.id}`)

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: userData.encrypted_name,
          email: userData.encrypted_email,
          role: user.role,
        },
      },
      message: "Usuario registrado exitosamente",
    })
  } catch (error) {
    logger.error("Error en registro:", error)
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      code: "INTERNAL_SERVER_ERROR",
    })
  }
}

// Validaciones
const loginValidation = [
  body("email").isEmail().withMessage("Email inválido"),
  body("password").isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres"),
]

const registerValidation = [
  body("name").notEmpty().withMessage("El nombre es requerido"),
  body("email").isEmail().withMessage("Email inválido"),
  body("password").isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres"),
  body("role").isIn(["Administrador", "Veterinario", "Recepcionista"]).withMessage("Rol inválido"),
]

module.exports = {
  login,
  register,
  loginValidation,
  registerValidation,
}
