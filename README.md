# PetPocket Backend API Documentation

## Información General

- **Base URL**: `http://localhost:3001/api`
- **Autenticación**: JWT Bearer Token
- **Formato de respuesta**: JSON
- **Rate Limit**: 100 requests por 15 minutos

## Estructura de Respuestas

### Respuesta Exitosa
\`\`\`json
{
  "success": true,
  "data": {},
  "message": "Mensaje descriptivo"
}
\`\`\`

### Respuesta de Error
\`\`\`json
{
  "success": false,
  "error": "Mensaje de error",
  "code": "ERROR_CODE"
}
\`\`\`

## Autenticación

### 1. Registro de Usuario
**POST** `/auth/register`

**Headers:**
\`\`\`
Content-Type: application/json
\`\`\`

**Body:**
\`\`\`json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "123456",
  "role": "Veterinario"
}
\`\`\`

**Respuesta:**
\`\`\`json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "role": "Veterinario"
    }
  },
  "message": "Usuario registrado exitosamente"
}
\`\`\`

### 2. Iniciar Sesión
**POST** `/auth/login`

**Body:**
\`\`\`json
{
  "email": "juan@example.com",
  "password": "123456"
}
\`\`\`

**Respuesta:**
\`\`\`json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "role": "Veterinario"
    }
  },
  "message": "Login exitoso"
}
\`\`\`

## Usuarios (Solo Administradores)

### 3. Obtener Todos los Usuarios
**GET** `/users`

**Headers:**
\`\`\`
Authorization: Bearer {token}
\`\`\`

**Query Parameters:**
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Elementos por página (default: 10)

### 4. Crear Usuario
**POST** `/users`

**Headers:**
\`\`\`
Authorization: Bearer {token}
Content-Type: application/json
\`\`\`

**Body:**
\`\`\`json
{
  "name": "María García",
  "email": "maria@example.com",
  "password": "123456",
  "role": "Recepcionista"
}
\`\`\`

### 5. Actualizar Usuario
**PUT** `/users/{id}`

**Body:**
\`\`\`json
{
  "name": "María García Actualizada",
  "email": "maria.nueva@example.com",
  "role": "Veterinario"
}
\`\`\`

### 6. Eliminar Usuario
**DELETE** `/users/{id}`

## Propietarios

### 7. Obtener Todos los Propietarios
**GET** `/owners`

**Query Parameters:**
- `page` (opcional): Número de página
- `limit` (opcional): Elementos por página
- `search` (opcional): Buscar por nombre, email o teléfono

**Ejemplo:**
\`\`\`
GET /owners?page=1&limit=5&search=juan
\`\`\`

### 8. Crear Propietario
**POST** `/owners`

**Body:**
\`\`\`json
{
  "name": "Carlos Rodríguez",
  "email": "carlos@example.com",
  "phone": "+1234567890"
}
\`\`\`

### 9. Actualizar Propietario
**PUT** `/owners/{id}`

**Body:**
\`\`\`json
{
  "name": "Carlos Rodríguez Actualizado",
  "phone": "+0987654321"
}
\`\`\`

### 10. Eliminar Propietario
**DELETE** `/owners/{id}`

### 11. Obtener Mascotas de un Propietario
**GET** `/owners/{id}/pets`

## Mascotas

### 12. Obtener Todas las Mascotas
**GET** `/pets`

**Query Parameters:**
- `page`, `limit`, `search` (como en owners)
- `owner_id` (opcional): Filtrar por propietario

### 13. Crear Mascota
**POST** `/pets`

**Body:**
\`\`\`json
{
  "name": "Max",
  "breed": "Golden Retriever",
  "age": 3,
  "owner_id": 1,
  "health_status": "Saludable"
}
\`\`\`

### 14. Actualizar Mascota
**PUT** `/pets/{id}`

### 15. Eliminar Mascota
**DELETE** `/pets/{id}`

### 16. Obtener Historial Médico
**GET** `/pets/{id}/medical-history`

### 17. Agregar Registro Médico
**POST** `/pets/{id}/medical-history`

**Body:**
\`\`\`json
{
  "diagnosis": "Infección de oído",
  "treatment": "Antibióticos por 7 días",
  "observations": "Revisar en una semana"
}
\`\`\`

## Servicios

### 18. Obtener Todos los Servicios
**GET** `/services`

**Query Parameters:**
- `active` (opcional): true/false
- `search` (opcional): Buscar por nombre o descripción

### 19. Crear Servicio (Solo Administradores)
**POST** `/services`

**Body:**
\`\`\`json
{
  "name": "Consulta General",
  "description": "Consulta veterinaria general",
  "image": "https://example.com/image.jpg",
  "subcategories": [
    {
      "id": "consulta-basica",
      "name": "Consulta Básica",
      "price": 50.00
    },
    {
      "id": "consulta-especializada",
      "name": "Consulta Especializada",
      "price": 80.00
    }
  ],
  "active": true
}
\`\`\`

### 20. Actualizar Servicio
**PUT** `/services/{id}`

### 21. Eliminar Servicio
**DELETE** `/services/{id}`

## Productos

### 22. Obtener Todos los Productos
**GET** `/products`

**Query Parameters:**
- `category` (opcional): Filtrar por categoría
- `active` (opcional): true/false

### 23. Crear Producto (Solo Administradores)
**POST** `/products`

**Body:**
\`\`\`json
{
  "name": "Alimento Premium para Perros",
  "description": "Alimento balanceado para perros adultos",
  "price": 25.99,
  "stock": 100,
  "category": "Alimentos",
  "image": "https://example.com/product.jpg",
  "active": true
}
\`\`\`

### 24. Actualizar Producto
**PUT** `/products/{id}`

### 25. Eliminar Producto
**DELETE** `/products/{id}`

### 26. Actualizar Stock
**PATCH** `/products/{id}/stock`

**Body:**
\`\`\`json
{
  "quantity": 10,
  "operation": "add"
}
\`\`\`

## Órdenes

### 27. Obtener Todas las Órdenes
**GET** `/orders`

**Query Parameters:**
- `status` (opcional): Cumplido, En Progreso, No Cumplido
- `payment_status` (opcional): Pagado, Pendiente, No Pagado

### 28. Crear Orden
**POST** `/orders`

**Body:**
\`\`\`json
{
  "client_id": 1,
  "products": [
    {
      "productId": "64f8a1b2c3d4e5f6a7b8c9d0",
      "quantity": 2
    },
    {
      "productId": "64f8a1b2c3d4e5f6a7b8c9d1",
      "quantity": 1
    }
  ],
  "notes": "Entrega urgente",
  "payment_status": "Pendiente"
}
\`\`\`

### 29. Actualizar Orden
**PUT** `/orders/{id}`

**Body:**
\`\`\`json
{
  "payment_status": "Pagado",
  "fulfillment_status": "Cumplido",
  "notes": "Orden completada satisfactoriamente"
}
\`\`\`

### 30. Obtener Detalles de Orden
**GET** `/orders/{id}/details`

## Citas

### 31. Obtener Todas las Citas
**GET** `/appointments`

**Query Parameters:**
- `status` (opcional): Pendiente, Completada, Cancelada
- `date` (opcional): YYYY-MM-DD
- `client_id` (opcional): ID del cliente

### 32. Crear Cita
**POST** `/appointments`

**Body:**
\`\`\`json
{
  "client_id": 1,
  "pet_id": 1,
  "appointment_date": "2024-01-15T10:00:00Z",
  "services": [
    {
      "serviceId": "64f8a1b2c3d4e5f6a7b8c9d0",
      "subcategoryId": "consulta-basica"
    }
  ],
  "notes": "Primera consulta",
  "payment_status": "No Pagado"
}
\`\`\`

### 33. Actualizar Cita
**PUT** `/appointments/{id}`

**Body:**
\`\`\`json
{
  "status": "Completada",
  "payment_status": "Pagado",
  "diagnosis": "Mascota en buen estado",
  "treatment": "Vacunación al día",
  "followUp": {
    "required": true,
    "date": "2024-02-15T10:00:00Z",
    "notes": "Revisar vacunas"
  }
}
\`\`\`

### 34. Obtener Detalles de Cita
**GET** `/appointments/{id}/details`

## Estadísticas (Administradores y Veterinarios)

### 35. Obtener Estadísticas Generales
**GET** `/stats`

**Respuesta:**
\`\`\`json
{
  "success": true,
  "data": {
    "users": 5,
    "owners": 25,
    "pets": 40,
    "orders": 15,
    "appointments": 30,
    "products": 20,
    "services": 8
  },
  "message": "Estadísticas obtenidas exitosamente"
}
\`\`\`

## Códigos de Error Comunes

- `TOKEN_REQUIRED`: Token de acceso requerido
- `INVALID_TOKEN`: Token inválido o expirado
- `INSUFFICIENT_PERMISSIONS`: Permisos insuficientes
- `VALIDATION_ERROR`: Datos de entrada inválidos
- `NOT_FOUND`: Recurso no encontrado
- `EMAIL_EXISTS`: Email ya registrado
- `INSUFFICIENT_STOCK`: Stock insuficiente
- `RATE_LIMIT_EXCEEDED`: Límite de peticiones excedido

## Roles y Permisos

### Administrador
- Acceso completo a todas las funcionalidades
- Gestión de usuarios, servicios y productos
- Acceso a estadísticas y reportes

### Veterinario
- Gestión de propietarios, mascotas y citas
- Agregar registros médicos
- Acceso a estadísticas

### Recepcionista
- Gestión de propietarios, mascotas, citas y órdenes
- Actualización de stock de productos
- Sin acceso a gestión de usuarios
\`\`\`

Ahora creo una colección completa de Postman:
