const winston = require("winston");
const path = require("path");
const fs = require("fs");

// Crear directorio de logs si no existe
const logDir = path.join(__dirname, "../../logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
  console.log("📁 Directorio de logs creado:", logDir);
}

// Configuración de nivel de log desde variable de entorno
const logLevel = process.env.LOG_LEVEL || "info";

// Formato personalizado para consola
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta, null, 2)}`;
    }
    return msg;
  })
);

// Formato para el archivo de log
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const logger = winston.createLogger({
  level: logLevel,
  defaultMeta: { 
    service: 'petpocket-backend',
    version: process.env.npm_package_version || '1.0.0'
  },
  transports: [
    // Archivo único para todos los logs
    new winston.transports.File({
      filename: path.join(logDir, "app.log"),
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    
    // Consola solo en desarrollo
    ...(process.env.NODE_ENV !== 'production' ? [
      new winston.transports.Console({
        format: consoleFormat,
        handleExceptions: true,
        handleRejections: true
      })
    ] : [])
  ],
  
  exitOnError: false
});

// Métodos de conveniencia
logger.success = (message, meta = {}) => {
  logger.info(`✅ ${message}`, meta);
};

logger.security = (message, meta = {}) => {
  logger.error(`🔒 SECURITY: ${message}`, meta);
};

// Sobrescribir el método warn para agregar emoji
const originalWarn = logger.warn;
logger.warn = (message, meta = {}) => {
  originalWarn(`⚠️ ${message}`, meta);
};

// Log de inicio
logger.info("🚀 Logger inicializado", {
  level: logLevel,
  logDir: logDir,
  nodeEnv: process.env.NODE_ENV
});

module.exports = logger;
