const mongoose = require("mongoose")
const logger = require("./logger")
const fs = require("fs")
const path = require("path")
const config = require("../../key")

const connectMongoDB = async () => {
  try {
    // Verificar que la URI de MongoDB esté configurada
    if (!config.MONGODB_URI) {
      throw new Error("MONGODB_URI no está configurada en las variables de entorno")
    }

    logger.info("Intentando conectar a MongoDB...")
    
    // Configuración simplificada y compatible
    const mongoOptions = {
      serverSelectionTimeoutMS: 10000,   // Timeout para selección de servidor
      socketTimeoutMS: 45000,            // Timeout para socket
      maxPoolSize: 10,                   // Máximo conexiones en pool
      minPoolSize: 2,                    // Mínimo conexiones en pool
      bufferCommands: false,             // Deshabilitar buffer de comandos
      // Removemos bufferMaxEntries porque causa problemas
    }

    // Configuración para Mongoose 7+
    mongoose.set('strictQuery', false)
    
    // Intentar conexión
    await mongoose.connect(config.MONGODB_URI, mongoOptions)
    
    logger.info("✅ Conexión a MongoDB establecida correctamente")
    
    // Obtener información de la conexión
    const db = mongoose.connection.db
    const dbName = mongoose.connection.name
    const host = mongoose.connection.host
    const port = mongoose.connection.port
    
    logger.info(`📊 MongoDB Info:`, {
      host: host || 'localhost',
      port: port || 27017,
      database: dbName
    })

    // Verificar/crear la base de datos y colecciones básicas
    await ensureDatabaseSetup(db, dbName)
    
  } catch (error) {
    logger.error("❌ Error al conectar con MongoDB:", {
      error: error.message,
      code: error.code,
      uri: config.MONGODB_URI ? "URI configurada" : "URI no configurada"
    })
    
    // Si es un error de conexión inicial, intentar crear la BD
    if (error.message.includes('ECONNREFUSED') || error.code === 'ENOTFOUND') {
      logger.warn("⚠️ MongoDB no está disponible. Verifica que el servicio esté ejecutándose.")
      logger.info("💡 Para instalar MongoDB localmente:")
      logger.info("   Windows: choco install mongodb")
      logger.info("   Mac: brew install mongodb-community")
      logger.info("   Ubuntu: sudo apt-get install mongodb")
    }
    
    throw error
  }
}

// Función para asegurar que la BD y colecciones existan
const ensureDatabaseSetup = async (db, dbName) => {
  try {
    logger.info(`🔧 Configurando base de datos: ${dbName}`)
    
    // Listar colecciones existentes
    const collections = await db.listCollections().toArray()
    const collectionNames = collections.map(col => col.name)
    
    logger.info(`📁 Colecciones existentes: ${collectionNames.length > 0 ? collectionNames.join(', ') : 'ninguna'}`)
    
    // Colecciones que necesitamos crear
    const requiredCollections = [
      'appointmentdetails',
      'orderdetails', 
      'petmedicalhistories',
      'products',
      'services',
      'userdetails'
    ]
    
    // Crear colecciones faltantes
    for (const collectionName of requiredCollections) {
      if (!collectionNames.includes(collectionName)) {
        await db.createCollection(collectionName)
        logger.info(`✨ Colección creada: ${collectionName}`)
      }
    }
    
    // Crear índices básicos para optimización
    await createBasicIndexes(db)
    
    logger.info("✅ Configuración de MongoDB completada")
    
  } catch (error) {
    logger.warn("⚠️ Error en configuración de BD (no crítico):", error.message)
  }
}

// Crear índices básicos para mejor rendimiento
const createBasicIndexes = async (db) => {
  try {
    // Índices para búsquedas frecuentes
    const indexOperations = [
      { collection: 'appointmentdetails', index: { appointmentId: 1 } },
      { collection: 'orderdetails', index: { orderId: 1 } },
      { collection: 'petmedicalhistories', index: { petId: 1 } },
      { collection: 'products', index: { name: 1, category: 1 } },
      { collection: 'services', index: { name: 1, active: 1 } },
      { collection: 'userdetails', index: { userId: 1 } }
    ]
    
    for (const { collection, index } of indexOperations) {
      try {
        await db.collection(collection).createIndex(index)
      } catch (indexError) {
        // Los índices pueden ya existir, ignorar error
      }
    }
    
    logger.info("📊 Índices básicos configurados")
  } catch (error) {
    logger.warn("⚠️ Error creando índices:", error.message)
  }
}

// Manejo de eventos de conexión
mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB desconectado - Intentando reconectar...")
})

mongoose.connection.on("reconnected", () => {
  logger.info("MongoDB reconectado exitosamente")
})

mongoose.connection.on("error", (error) => {
  logger.error("Error en la conexión de MongoDB:", error)
})

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close()
    logger.info("Conexión MongoDB cerrada por terminación de aplicación")
    process.exit(0)
  } catch (error) {
    logger.error("Error al cerrar conexión MongoDB:", error)
    process.exit(1)
  }
})

module.exports = { connectMongoDB }