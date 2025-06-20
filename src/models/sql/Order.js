const { DataTypes } = require("sequelize")
const { sequelize } = require("../../config/database.sql")
const Owner = require("./Owner")

const Order = sequelize.define(
  "Order",
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
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    payment_status: {
      type: DataTypes.ENUM("Pagado", "Pendiente", "No Pagado"),
      allowNull: true,
    },
    fulfillment_status: {
      type: DataTypes.ENUM("Cumplido", "En Progreso", "No Cumplido"),
      allowNull: true,
    },
    order_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "orders",
    timestamps: false,
  },
)

// Relaciones
Order.belongsTo(Owner, { foreignKey: "client_id", as: "client" })

module.exports = Order
