const logger = require("../config/logger")

const loggerMiddleware = (req, res, next) => {
  const start = Date.now()

  // Log de la petición
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    timestamp: new Date().toISOString(),
  })

  // Interceptar la respuesta
  const originalSend = res.send
  res.send = function (data) {
    const duration = Date.now() - start

    logger.info(`Response ${res.statusCode}`, {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    })

    originalSend.call(this, data)
  }

  next()
}

module.exports = loggerMiddleware
