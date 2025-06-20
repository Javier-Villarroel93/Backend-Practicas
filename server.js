const express = require("express")
const cors = require("cors")
const rateLimit = require("express-rate-limit")
const helmet = require("helmet")
require("dotenv").config()

const { connectMySQL } = require("./src/config/database.sql")
const { connectMongoDB } = require("./src/config/database.orm")
const logger = require("./src/config/logger")
const loggerMiddleware = require("./src/middleware/logger")
const routes = require("./src/routes")

const app = express()
const PORT = process.env.PORT || 3001

// Middleware de seguridad
app.use(helmet())

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
)

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana
  message: {
    success: false,
    error: "Demasiadas peticiones, intenta de nuevo más tarde",
    code: "RATE_LIMIT_EXCEEDED",
  },
})
app.use(limiter)

// Middleware de parsing
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))

// Middleware de logging
app.use(loggerMiddleware)

// Rutas
app.use("/api", routes)

// Manejo de errores centralizado
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`, {
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  })

  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Error interno del servidor",
    code: err.code || "INTERNAL_SERVER_ERROR",
  })
})

// Ruta 404
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Ruta no encontrada",
    code: "NOT_FOUND",
  })
})

// Inicializar conexiones y servidor
async function startServer() {
  try {
    await connectMySQL()
    await connectMongoDB()

    app.listen(PORT, () => {
      logger.info(`Servidor ejecutándose en puerto ${PORT}`)
      console.log(`🚀 Servidor PetPocket ejecutándose en http://localhost:${PORT}`)
    })
  } catch (error) {
    logger.error("Error al iniciar el servidor:", error)
    process.exit(1)
  }
}

startServer()

// Manejo de cierre graceful
process.on("SIGTERM", () => {
  logger.info("Cerrando servidor...")
  process.exit(0)
})

process.on("SIGINT", () => {
  logger.info("Cerrando servidor...")
  process.exit(0)
})
