const jwt = require("jsonwebtoken")
const logger = require("../config/logger")

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Token de acceso requerido",
      code: "TOKEN_REQUIRED",
    })
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn(`Token inválido desde IP: ${req.ip}`)
      return res.status(403).json({
        success: false,
        error: "Token inválido",
        code: "INVALID_TOKEN",
      })
    }

    req.user = user
    next()
  })
}

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: "No tienes permisos para realizar esta acción",
        code: "INSUFFICIENT_PERMISSIONS",
      })
    }
    next()
  }
}

module.exports = { authenticateToken, authorizeRoles }
