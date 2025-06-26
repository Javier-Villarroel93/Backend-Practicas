const { Sequelize } = require("sequelize")
const logger = require("./logger")
const config = require("../../key")

const sequelize = new Sequelize(
  config.MYSQL.DATABASE || "petpocket_sql",
  config.MYSQL.USER || "root",
  config.MYSQL.PASSWORD || "",
  {
    host: config.MYSQL.HOST || "localhost",
    dialect: "mysql",
    logging: (msg) => logger.info(msg),
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
)

const connectMySQL = async () => {
  try {
    await sequelize.authenticate()
    logger.info("Conexión a MySQL establecida correctamente")

    // Sincronizar modelos (solo en desarrollo)
    if (config.NODE_ENV !== "production") {
      await sequelize.sync({ alter: true })
      logger.info("Modelos de MySQL sincronizados")
    }
  } catch (error) {
    logger.error("Error al conectar con MySQL:", error)
    throw error
  }
}

module.exports = { sequelize, connectMySQL }
