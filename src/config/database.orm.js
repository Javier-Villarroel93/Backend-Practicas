const mongoose = require("mongoose")
const logger = require("./logger")

const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    logger.info("Conexión a MongoDB establecida correctamente")
  } catch (error) {
    logger.error("Error al conectar con MongoDB:", error)
    throw error
  }
}

mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB desconectado")
})

mongoose.connection.on("reconnected", () => {
  logger.info("MongoDB reconectado")
})

module.exports = { connectMongoDB }
