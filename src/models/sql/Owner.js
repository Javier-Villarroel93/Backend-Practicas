const { DataTypes } = require("sequelize")
const { sequelize } = require("../../config/database.sql")

const Owner = sequelize.define(
  "Owner",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    encrypted_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    encrypted_email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    encrypted_phone: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
  },
  {
    tableName: "owners",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  },
)

module.exports = Owner
