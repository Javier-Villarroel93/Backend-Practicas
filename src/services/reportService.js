const { sequelize } = require("../config/database.sql")
const Order = require("../models/sql/Order")
const Appointment = require("../models/sql/Appointment")
const logger = require("../config/logger")

class ReportService {
  static async getSalesReport(startDate, endDate) {
    try {
      const orders = await Order.findAll({
        where: {
          order_date: {
            [require("sequelize").Op.between]: [new Date(startDate), new Date(endDate)],
          },
          payment_status: "Pagado",
        },
        attributes: [
          [sequelize.fn("DATE", sequelize.col("order_date")), "date"],
          [sequelize.fn("SUM", sequelize.col("total")), "total_sales"],
          [sequelize.fn("COUNT", sequelize.col("id")), "total_orders"],
        ],
        group: [sequelize.fn("DATE", sequelize.col("order_date"))],
        order: [[sequelize.fn("DATE", sequelize.col("order_date")), "ASC"]],
      })

      return {
        success: true,
        data: orders,
        message: "Reporte de ventas generado exitosamente",
      }
    } catch (error) {
      logger.error("Error al generar reporte de ventas:", error)
      return {
        success: false,
        error: "Error al generar reporte",
      }
    }
  }

  static async getAppointmentsReport(startDate, endDate) {
    try {
      const appointments = await Appointment.findAll({
        where: {
          appointment_date: {
            [require("sequelize").Op.between]: [new Date(startDate), new Date(endDate)],
          },
        },
        attributes: [
          [sequelize.fn("DATE", sequelize.col("appointment_date")), "date"],
          "status",
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
          [sequelize.fn("SUM", sequelize.col("total")), "total_revenue"],
        ],
        group: [sequelize.fn("DATE", sequelize.col("appointment_date")), "status"],
        order: [[sequelize.fn("DATE", sequelize.col("appointment_date")), "ASC"]],
      })

      return {
        success: true,
        data: appointments,
        message: "Reporte de citas generado exitosamente",
      }
    } catch (error) {
      logger.error("Error al generar reporte de citas:", error)
      return {
        success: false,
        error: "Error al generar reporte",
      }
    }
  }
}

module.exports = ReportService
