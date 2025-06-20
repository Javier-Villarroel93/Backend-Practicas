const { body, validationResult } = require("express-validator")
const { sequelize } = require("../config/database.sql")
const Appointment = require("../models/sql/Appointment")
const Owner = require("../models/sql/Owner")
const Pet = require("../models/sql/Pet")
const AppointmentDetails = require("../models/mongodb/AppointmentDetails")
const Service = require("../models/mongodb/Service")
const { decryptFields } = require("../middleware/encryption")
const logger = require("../config/logger")

const getAllAppointments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, date, client_id } = req.query

    const offset = (page - 1) * limit
    const whereClause = {}

    if (status) {
      whereClause.status = status
    }

    if (client_id) {
      whereClause.client_id = client_id
    }

    if (date) {
      const startDate = new Date(date)
      const endDate = new Date(date)
      endDate.setDate(endDate.getDate() + 1)

      whereClause.appointment_date = {
        [require("sequelize").Op.between]: [startDate, endDate],
      }
    }

    const appointments = await Appointment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Owner,
          as: "client",
          attributes: ["id", "encrypted_name", "encrypted_email"],
        },
        {
          model: Pet,
          as: "pet",
          attributes: ["id", "encrypted_name", "breed"],
        },
      ],
      limit: Number.parseInt(limit),
      offset: Number.parseInt(offset),
      order: [["appointment_date", "ASC"]],
    })

    const appointmentsWithDetails = await Promise.all(
      appointments.rows.map(async (appointment) => {
        const clientData = appointment.client
          ? decryptFields(appointment.client.dataValues, ["encrypted_name", "encrypted_email"])
          : null

        const petData = appointment.pet ? decryptFields(appointment.pet.dataValues, ["encrypted_name"]) : null

        const appointmentDetails = await AppointmentDetails.findOne({
          appointmentId: appointment.id,
        })

        return {
          id: appointment.id,
          client: clientData
            ? {
                id: appointment.client.id,
                name: clientData.encrypted_name,
                email: clientData.encrypted_email,
              }
            : null,
          pet: petData
            ? {
                id: appointment.pet.id,
                name: petData.encrypted_name,
                breed: appointment.pet.breed,
              }
            : null,
          appointment_date: appointment.appointment_date,
          status: appointment.status,
          total: appointment.total,
          payment_status: appointment.payment_status,
          created_at: appointment.created_at,
          services: appointmentDetails?.services || [],
          notes: appointmentDetails?.notes || "",
        }
      }),
    )

    res.json({
      success: true,
      data: {
        appointments: appointmentsWithDetails,
        pagination: {
          total: appointments.count,
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          totalPages: Math.ceil(appointments.count / limit),
        },
      },
      message: "Citas obtenidas exitosamente",
    })
  } catch (error) {
    logger.error("Error al obtener citas:", error)
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      code: "INTERNAL_SERVER_ERROR",
    })
  }
}

const createAppointment = async (req, res) => {
  const transaction = await sequelize.transaction()

  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      await transaction.rollback()
      return res.status(400).json({
        success: false,
        error: "Datos de entrada inválidos",
        code: "VALIDATION_ERROR",
        details: errors.array(),
      })
    }

    const { client_id, pet_id, appointment_date, services, notes, payment_status = "No Pagado" } = req.body

    // Verificar que el cliente existe
    if (client_id) {
      const client = await Owner.findByPk(client_id)
      if (!client) {
        await transaction.rollback()
        return res.status(404).json({
          success: false,
          error: "Cliente no encontrado",
          code: "CLIENT_NOT_FOUND",
        })
      }
    }

    // Verificar que la mascota existe
    if (pet_id) {
      const pet = await Pet.findByPk(pet_id)
      if (!pet) {
        await transaction.rollback()
        return res.status(404).json({
          success: false,
          error: "Mascota no encontrada",
          code: "PET_NOT_FOUND",
        })
      }
    }

    // Verificar servicios y calcular total
    let total = 0
    const appointmentServices = []

    for (const item of services) {
      const service = await Service.findById(item.serviceId)
      if (!service) {
        await transaction.rollback()
        return res.status(404).json({
          success: false,
          error: `Servicio no encontrado: ${item.serviceId}`,
          code: "SERVICE_NOT_FOUND",
        })
      }

      let servicePrice = 0
      if (item.subcategoryId) {
        const subcategory = service.subcategories.find((sub) => sub.id === item.subcategoryId)
        if (!subcategory) {
          await transaction.rollback()
          return res.status(404).json({
            success: false,
            error: `Subcategoría no encontrada: ${item.subcategoryId}`,
            code: "SUBCATEGORY_NOT_FOUND",
          })
        }
        servicePrice = subcategory.price
      } else {
        // Si no hay subcategoría, usar el precio base del servicio
        servicePrice = service.subcategories[0]?.price || 0
      }

      total += servicePrice

      appointmentServices.push({
        serviceId: service._id,
        name: service.name,
        price: servicePrice,
        subcategoryId: item.subcategoryId,
      })
    }

    // Crear cita en MySQL
    const appointment = await Appointment.create(
      {
        client_id,
        pet_id,
        appointment_date: new Date(appointment_date),
        status: "Pendiente",
        total,
        payment_status,
      },
      { transaction },
    )

    // Crear detalles en MongoDB
    await AppointmentDetails.create({
      appointmentId: appointment.id,
      services: appointmentServices,
      notes: notes || "",
      followUp: {
        required: false,
      },
    })

    await transaction.commit()

    logger.info(`Cita creada: ${appointment.id} por usuario: ${req.user.id}`)

    res.status(201).json({
      success: true,
      data: {
        id: appointment.id,
        client_id: appointment.client_id,
        pet_id: appointment.pet_id,
        appointment_date: appointment.appointment_date,
        status: appointment.status,
        total: appointment.total,
        payment_status: appointment.payment_status,
        services: appointmentServices,
        notes: notes || "",
      },
      message: "Cita creada exitosamente",
    })
  } catch (error) {
    await transaction.rollback()
    logger.error("Error al crear cita:", error)
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      code: "INTERNAL_SERVER_ERROR",
    })
  }
}

const updateAppointment = async (req, res) => {
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

    const { id } = req.params
    const { appointment_date, status, payment_status, notes, diagnosis, treatment, followUp } = req.body

    const appointment = await Appointment.findByPk(id)
    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: "Cita no encontrada",
        code: "APPOINTMENT_NOT_FOUND",
      })
    }

    const updateData = {}
    if (appointment_date) updateData.appointment_date = new Date(appointment_date)
    if (status) updateData.status = status
    if (payment_status) updateData.payment_status = payment_status

    await appointment.update(updateData)

    // Actualizar detalles en MongoDB
    const mongoUpdateData = {}
    if (notes !== undefined) mongoUpdateData.notes = notes
    if (diagnosis !== undefined) mongoUpdateData.diagnosis = diagnosis
    if (treatment !== undefined) mongoUpdateData.treatment = treatment
    if (followUp !== undefined) mongoUpdateData.followUp = followUp

    if (Object.keys(mongoUpdateData).length > 0) {
      await AppointmentDetails.findOneAndUpdate({ appointmentId: Number.parseInt(id) }, mongoUpdateData)
    }

    logger.info(`Cita actualizada: ${id} por usuario: ${req.user.id}`)

    res.json({
      success: true,
      data: {
        id: appointment.id,
        appointment_date: appointment.appointment_date,
        status: appointment.status,
        payment_status: appointment.payment_status,
        total: appointment.total,
      },
      message: "Cita actualizada exitosamente",
    })
  } catch (error) {
    logger.error("Error al actualizar cita:", error)
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      code: "INTERNAL_SERVER_ERROR",
    })
  }
}

const getAppointmentDetails = async (req, res) => {
  try {
    const { id } = req.params

    const appointment = await Appointment.findByPk(id, {
      include: [
        {
          model: Owner,
          as: "client",
          attributes: ["id", "encrypted_name", "encrypted_email", "encrypted_phone"],
        },
        {
          model: Pet,
          as: "pet",
          attributes: ["id", "encrypted_name", "breed", "age"],
        },
      ],
    })

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: "Cita no encontrada",
        code: "APPOINTMENT_NOT_FOUND",
      })
    }

    const appointmentDetails = await AppointmentDetails.findOne({
      appointmentId: Number.parseInt(id),
    })

    const clientData = appointment.client
      ? decryptFields(appointment.client.dataValues, ["encrypted_name", "encrypted_email", "encrypted_phone"])
      : null

    const petData = appointment.pet ? decryptFields(appointment.pet.dataValues, ["encrypted_name"]) : null

    res.json({
      success: true,
      data: {
        id: appointment.id,
        client: clientData
          ? {
              id: appointment.client.id,
              name: clientData.encrypted_name,
              email: clientData.encrypted_email,
              phone: clientData.encrypted_phone,
            }
          : null,
        pet: petData
          ? {
              id: appointment.pet.id,
              name: petData.encrypted_name,
              breed: appointment.pet.breed,
              age: appointment.pet.age,
            }
          : null,
        appointment_date: appointment.appointment_date,
        status: appointment.status,
        total: appointment.total,
        payment_status: appointment.payment_status,
        created_at: appointment.created_at,
        services: appointmentDetails?.services || [],
        notes: appointmentDetails?.notes || "",
        diagnosis: appointmentDetails?.diagnosis || "",
        treatment: appointmentDetails?.treatment || "",
        followUp: appointmentDetails?.followUp || { required: false },
      },
      message: "Detalles de cita obtenidos exitosamente",
    })
  } catch (error) {
    logger.error("Error al obtener detalles de cita:", error)
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      code: "INTERNAL_SERVER_ERROR",
    })
  }
}

// Validaciones
const createAppointmentValidation = [
  body("client_id").optional().isInt().withMessage("ID del cliente debe ser un número"),
  body("pet_id").optional().isInt().withMessage("ID de la mascota debe ser un número"),
  body("appointment_date").isISO8601().withMessage("Fecha de cita debe ser válida"),
  body("services").isArray({ min: 1 }).withMessage("Debe incluir al menos un servicio"),
  body("services.*.serviceId").notEmpty().withMessage("ID del servicio es requerido"),
  body("services.*.subcategoryId").optional().isString().withMessage("ID de subcategoría inválido"),
  body("payment_status").optional().isIn(["Pagado", "No Pagado"]).withMessage("Estado de pago inválido"),
  body("notes").optional().isString().withMessage("Las notas deben ser texto"),
]

const updateAppointmentValidation = [
  body("appointment_date").optional().isISO8601().withMessage("Fecha de cita debe ser válida"),
  body("status").optional().isIn(["Pendiente", "Completada", "Cancelada"]).withMessage("Estado inválido"),
  body("payment_status").optional().isIn(["Pagado", "No Pagado"]).withMessage("Estado de pago inválido"),
  body("notes").optional().isString().withMessage("Las notas deben ser texto"),
  body("diagnosis").optional().isString().withMessage("El diagnóstico debe ser texto"),
  body("treatment").optional().isString().withMessage("El tratamiento debe ser texto"),
]

module.exports = {
  getAllAppointments,
  createAppointment,
  updateAppointment,
  getAppointmentDetails,
  createAppointmentValidation,
  updateAppointmentValidation,
}
