const { DataTypes } = require("sequelize")
const { sequelize } = require("../../config/database.sql")
const bcrypt = require("bcryptjs")

const User = sequelize.define(
  "User",
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
      unique: true,
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("Administrador", "Veterinario", "Recepcionista"),
      allowNull: false,
    },
  },
  {
    tableName: "users",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
)

// Hook para hashear la contraseña antes de crear
User.beforeCreate(async (user) => {
  if (user.password_hash) {
    user.password_hash = await bcrypt.hash(user.password_hash, 10)
  }
})

// Hook para hashear la contraseña antes de actualizar
User.beforeUpdate(async (user) => {
  if (user.changed("password_hash")) {
    user.password_hash = await bcrypt.hash(user.password_hash, 10)
  }
})

// Método para verificar contraseña
User.prototype.validatePassword = async function (password) {
  return await bcrypt.compare(password, this.password_hash)
}

module.exports = User
