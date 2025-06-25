const express = require("express")
const { authenticateToken, authorizeRoles } = require("../middleware/auth")
const { encryptFields } = require("../middleware/encryption")

// Importar controladores
const authController = require("../controllers/authController")
const userController = require("../controllers/userController")
const ownerController = require("../controllers/ownerController")
const petController = require("../controllers/petController")
const serviceController = require("../controllers/serviceController")
const productController = require("../controllers/productController")
const orderController = require("../controllers/orderController")
const appointmentController = require("../controllers/appointmentController")

const router = express.Router()

// ==================== RUTAS DE AUTENTICACIÓN ====================
router.post("/auth/login", authController.loginValidation, authController.login)
router.post(
  "/auth/register",
  authController.registerValidation,         // ✅ Primero validas en texto plano
  encryptFields(["name", "email"]),          // 🔒 Luego encriptas
  authController.register                    // 🚀 Luego ejecutas la lógica de registro
)


// Middleware de autenticación para todas las rutas siguientes
router.use(authenticateToken)

// ==================== RUTAS DE USUARIOS ====================
router.get("/users", authorizeRoles("Administrador"), userController.getAllUsers)
router.post(
  "/users",
  authorizeRoles("Administrador"),
  encryptFields(["name", "email"]),
  userController.createUserValidation,
  userController.createUser,
)
router.put(
  "/users/:id",
  authorizeRoles("Administrador"),
  encryptFields(["name", "email"]),
  userController.updateUserValidation,
  userController.updateUser,
)
router.delete("/users/:id", authorizeRoles("Administrador"), userController.deleteUser)

// ==================== RUTAS DE PROPIETARIOS ====================
router.get("/owners", ownerController.getAllOwners)
router.post(
  "/owners",
  encryptFields(["name", "email", "phone"]),
  ownerController.createOwnerValidation,
  ownerController.createOwner,
)
router.put(
  "/owners/:id",
  encryptFields(["name", "email", "phone"]),
  ownerController.updateOwnerValidation,
  ownerController.updateOwner,
)
router.delete("/owners/:id", ownerController.deleteOwner)
router.get("/owners/:id/pets", ownerController.getOwnerPets)

// ==================== RUTAS DE MASCOTAS ====================
router.get("/pets", petController.getAllPets)
router.post("/pets", encryptFields(["name"]), petController.createPetValidation, petController.createPet)
router.put("/pets/:id", encryptFields(["name"]), petController.updatePetValidation, petController.updatePet)
router.delete("/pets/:id", petController.deletePet)
router.get("/pets/:id/medical-history", petController.getPetMedicalHistory)
router.post(
  "/pets/:id/medical-history",
  authorizeRoles("Administrador", "Veterinario"),
  petController.addMedicalRecordValidation,
  petController.addMedicalRecord,
)

// ==================== RUTAS DE SERVICIOS ====================
router.get("/services", serviceController.getAllServices)
router.post(
  "/services",
  authorizeRoles("Administrador"),
  serviceController.createServiceValidation,
  serviceController.createService,
)
router.put(
  "/services/:id",
  authorizeRoles("Administrador"),
  serviceController.updateServiceValidation,
  serviceController.updateService,
)
router.delete("/services/:id", authorizeRoles("Administrador"), serviceController.deleteService)

// ==================== RUTAS DE PRODUCTOS ====================
router.get("/products", productController.getAllProducts)
router.post(
  "/products",
  authorizeRoles("Administrador"),
  productController.createProductValidation,
  productController.createProduct,
)
router.put(
  "/products/:id",
  authorizeRoles("Administrador"),
  productController.updateProductValidation,
  productController.updateProduct,
)
router.delete("/products/:id", authorizeRoles("Administrador"), productController.deleteProduct)
router.patch(
  "/products/:id/stock",
  authorizeRoles("Administrador", "Recepcionista"),
  productController.updateStockValidation,
  productController.updateStock,
)

// ==================== RUTAS DE ÓRDENES ====================
router.get("/orders", orderController.getAllOrders)
router.post("/orders", orderController.createOrderValidation, orderController.createOrder)
router.put("/orders/:id", orderController.updateOrderValidation, orderController.updateOrder)
router.get("/orders/:id/details", orderController.getOrderDetails)

// ==================== RUTAS DE CITAS ====================
router.get("/appointments", appointmentController.getAllAppointments)
router.post("/appointments", appointmentController.createAppointmentValidation, appointmentController.createAppointment)
router.put(
  "/appointments/:id",
  appointmentController.updateAppointmentValidation,
  appointmentController.updateAppointment,
)
router.get("/appointments/:id/details", appointmentController.getAppointmentDetails)

// ==================== RUTA DE PRUEBA ====================
router.get("/test", (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user,
      timestamp: new Date().toISOString(),
    },
    message: "API funcionando correctamente",
  })
})

// ==================== ESTADÍSTICAS (BONUS) ====================
router.get("/stats", authorizeRoles("Administrador", "Veterinario"), async (req, res) => {
  try {
    const User = require("../models/sql/User")
    const Owner = require("../models/sql/Owner")
    const Pet = require("../models/sql/Pet")
    const Order = require("../models/sql/Order")
    const Appointment = require("../models/sql/Appointment")
    const Product = require("../models/mongodb/Product")
    const Service = require("../models/mongodb/Service")

    const [totalUsers, totalOwners, totalPets, totalOrders, totalAppointments, totalProducts, totalServices] =
      await Promise.all([
        User.count(),
        Owner.count(),
        Pet.count(),
        Order.count(),
        Appointment.count(),
        Product.countDocuments(),
        Service.countDocuments(),
      ])

    res.json({
      success: true,
      data: {
        users: totalUsers,
        owners: totalOwners,
        pets: totalPets,
        orders: totalOrders,
        appointments: totalAppointments,
        products: totalProducts,
        services: totalServices,
      },
      message: "Estadísticas obtenidas exitosamente",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error al obtener estadísticas",
      code: "INTERNAL_SERVER_ERROR",
    })
  }
})

module.exports = router
