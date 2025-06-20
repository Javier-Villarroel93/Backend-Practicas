const { DataTypes } = require("sequelize")
const { sequelize } = require("../../config/database.sql")
const Owner = require("./Owner")
const Pet = require("./Pet")

const Appointment = sequelize.define(
  "Appointment",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Owner,
        key: "id",
      },
    },
    pet_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Pet,
        key: "id",
      },
    },
    appointment_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("Pendiente", "Completada", "Cancelada"),
      defaultValue: "Pendiente",
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    payment_status: {
      type: DataTypes.ENUM("Pagado", "No Pagado"),
      defaultValue: "No Pagado",
    },
  },
  {
    tableName: "appointments",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  },
)

// Relaciones
Appointment.belongsTo(Owner, { foreignKey: "client_id", as: "client" })
Appointment.belongsTo(Pet, { foreignKey: "pet_id", as: "pet" })
Owner.hasMany(Appointment, { foreignKey: "client_id", as: "appointments" })
Pet.hasMany(Appointment, { foreignKey: "pet_id", as: "appointments" })

module.exports = Appointment
