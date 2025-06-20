const logger = require("../config/logger")

// Simulador de servicio de email (puedes integrar con SendGrid, Nodemailer, etc.)
class EmailService {
  static async sendWelcomeEmail(email, name) {
    try {
      // Aquí integrarías con tu proveedor de email
      logger.info(`Email de bienvenida enviado a: ${email}`)
      return { success: true, message: "Email enviado exitosamente" }
    } catch (error) {
      logger.error("Error al enviar email de bienvenida:", error)
      return { success: false, error: error.message }
    }
  }

  static async sendAppointmentReminder(email, appointmentData) {
    try {
      logger.info(`Recordatorio de cita enviado a: ${email}`)
      return { success: true, message: "Recordatorio enviado exitosamente" }
    } catch (error) {
      logger.error("Error al enviar recordatorio:", error)
      return { success: false, error: error.message }
    }
  }

  static async sendOrderConfirmation(email, orderData) {
    try {
      logger.info(`Confirmación de orden enviada a: ${email}`)
      return { success: true, message: "Confirmación enviada exitosamente" }
    } catch (error) {
      logger.error("Error al enviar confirmación:", error)
      return { success: false, error: error.message }
    }
  }
}

module.exports = EmailService
