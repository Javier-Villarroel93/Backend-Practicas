const { DataTypes } = require("sequelize")
const { sequelize } = require("../../config/database.sql")
const Owner = require("./Owner")

const Pet = sequelize.define(
  "Pet",
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
    breed: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    owner_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Owner,
        key: "id",
      },
    },
    health_status: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
  },
  {
    tableName: "pets",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  },
)

// Relaciones
Pet.belongsTo(Owner, { foreignKey: "owner_id", as: "owner" })
Owner.hasMany(Pet, { foreignKey: "owner_id", as: "pets" })

module.exports = Pet
