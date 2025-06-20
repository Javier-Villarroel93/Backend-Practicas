# 📚 INDIEC API - Documentación de Endpoints

## 🌐 Información General

- **Base URL**: `http://localhost:3000/api`
- **Formato de respuesta**: JSON
- **Autenticación**: JWT Bearer Token
- **CORS**: Configurado para `http://localhost:5173`

## 📋 Estructura de Respuestas

### Respuesta Exitosa
\`\`\`json
{
  "success": true,
  "message": "Operación exitosa",
  "data": {},
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
\`\`\`

### Respuesta de Error
\`\`\`json
{
  "success": false,
  "message": "Descripción del error",
  "errors": [
    {
      "field": "email",
      "message": "El email es requerido"
    }
  ]
}
\`\`\`

---

## 🔐 AUTENTICACIÓN

### 1. Registro de Usuario
**POST** `/auth/register`

**Body:**
\`\`\`json
{
  "email": "usuario@ejemplo.com",
  "password": "123456",
  "nombres": "Juan Carlos",
  "apellidos": "Pérez García",
  "genero": "Masculino",
  "fecha": "1990-05-15"
}
\`\`\`

**Respuesta:**
\`\`\`json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "id": 1,
    "email": "usuario@ejemplo.com",
    "nombres": "Juan Carlos",
    "apellidos": "Pérez García"
  }
}
\`\`\`

**Códigos de Estado:**
- `201`: Usuario creado exitosamente
- `409`: Email ya registrado
- `400`: Datos inválidos

---

### 2. Login de Usuario
**POST** `/auth/login`

**Body:**
\`\`\`json
{
  "email": "usuario@ejemplo.com",
  "password": "123456"
}
\`\`\`

**Respuesta:**
\`\`\`json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "usuario@ejemplo.com",
      "nombres": "Juan Carlos",
      "apellidos": "Pérez García",
      "genero": "Masculino",
      "fecha": "1990-05-15"
    }
  }
}
\`\`\`

**Códigos de Estado:**
- `200`: Login exitoso
- `401`: Credenciales inválidas
- `401`: Usuario inactivo

---

## 👤 USUARIOS

### 3. Obtener Perfil
**GET** `/users/profile`

**Headers:**
\`\`\`
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`

**Respuesta:**
\`\`\`json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "usuario@ejemplo.com",
    "nombres": "Juan Carlos",
    "apellidos": "Pérez García",
    "genero": "Masculino",
    "fecha": "1990-05-15",
    "estado": true,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z",
    "details": {
      "foto": "/uploads/1642234567890-abc123.jpg",
      "telefono": "+57 300 123 4567",
      "ubicacion": "Bogotá, Colombia",
      "bio": "Músico apasionado por el rock alternativo"
    }
  }
}
\`\`\`

---

### 4. Actualizar Perfil
**PUT** `/users/profile`

**Headers:**
\`\`\`
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`

**Body:**
\`\`\`json
{
  "nombres": "Juan Carlos",
  "apellidos": "Pérez García",
  "genero": "Masculino",
  "telefono": "+57 300 123 4567",
  "ubicacion": "Bogotá, Colombia",
  "bio": "Músico apasionado por el rock alternativo"
}
\`\`\`

**Respuesta:**
\`\`\`json
{
  "success": true,
  "message": "Perfil actualizado exitosamente"
}
\`\`\`

---

### 5. Subir Foto de Perfil
**POST** `/users/profile/photo`

**Headers:**
\`\`\`
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data
\`\`\`

**Body (Form Data):**
\`\`\`
photo: [archivo de imagen]
\`\`\`

**Respuesta:**
\`\`\`json
{
  "success": true,
  "message": "Foto de perfil actualizada exitosamente",
  "data": {
    "photoPath": "/uploads/1642234567890-abc123.jpg"
  }
}
\`\`\`

---

## 🎵 MÚSICA

### 6. Listar Canciones
**GET** `/music?page=1&limit=10`

**Headers:**
\`\`\`
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`

**Respuesta:**
\`\`\`json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "titulo": "Bohemian Rhapsody",
      "album": "A Night at the Opera",
      "duracion": "5:55",
      "año": 1975,
      "genero": "Rock",
      "estado": "Activo",
      "user_id": 1,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z",
      "details": {
        "foto": "/uploads/music-1642234567890.jpg",
        "descripcion": "Una obra maestra del rock progresivo",
        "lyrics": "Is this the real life? Is this just fantasy?..."
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
\`\`\`

---

### 7. Crear Canción
**POST** `/music`

**Headers:**
\`\`\`
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`

**Body:**
\`\`\`json
{
  "titulo": "Stairway to Heaven",
  "album": "Led Zeppelin IV",
  "duracion": "8:02",
  "año": 1971,
  "genero": "Rock"
}
\`\`\`

**Respuesta:**
\`\`\`json
{
  "success": true,
  "message": "Canción creada exitosamente",
  "data": {
    "id": 2,
    "titulo": "Stairway to Heaven",
    "album": "Led Zeppelin IV",
    "duracion": "8:02",
    "año": 1971,
    "genero": "Rock",
    "estado": "Activo",
    "user_id": 1,
    "created_at": "2024-01-15T11:00:00.000Z",
    "updated_at": "2024-01-15T11:00:00.000Z"
  }
}
\`\`\`

---

### 8. Obtener Canción por ID
**GET** `/music/1`

**Headers:**
\`\`\`
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`

**Respuesta:**
\`\`\`json
{
  "success": true,
  "data": {
    "id": 1,
    "titulo": "Bohemian Rhapsody",
    "album": "A Night at the Opera",
    "duracion": "5:55",
    "año": 1975,
    "genero": "Rock",
    "estado": "Activo",
    "user_id": 1,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z",
    "details": {
      "foto": "/uploads/music-1642234567890.jpg",
      "descripcion": "Una obra maestra del rock progresivo",
      "lyrics": "Is this the real life? Is this just fantasy?..."
    }
  }
}
\`\`\`

---

### 9. Actualizar Canción
**PUT** `/music/1`

**Headers:**
\`\`\`
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`

**Body:**
\`\`\`json
{
  "titulo": "Bohemian Rhapsody (Remastered)",
  "album": "A Night at the Opera",
  "duracion": "5:55",
  "año": 1975,
  "genero": "Rock"
}
\`\`\`

**Respuesta:**
\`\`\`json
{
  "success": true,
  "message": "Canción actualizada exitosamente"
}
\`\`\`

---

### 10. Eliminar Canción
**DELETE** `/music/1`

**Headers:**
\`\`\`
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`

**Respuesta:**
\`\`\`json
{
  "success": true,
  "message": "Canción eliminada exitosamente"
}
\`\`\`

---

### 11. Subir Imagen de Canción
**POST** `/music/1/photo`

**Headers:**
\`\`\`
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data
\`\`\`

**Body (Form Data):**
\`\`\`
photo: [archivo de imagen]
\`\`\`

**Respuesta:**
\`\`\`json
{
  "success": true,
  "message": "Imagen actualizada exitosamente",
  "data": {
    "photoPath": "/uploads/music-1642234567890.jpg"
  }
}
\`\`\`

---

## 💿 ÁLBUMES

### 12. Listar Álbumes
**GET** `/albums?page=1&limit=10`

**Headers:**
\`\`\`
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`

**Respuesta:**
\`\`\`json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "titulo": "The Dark Side of the Moon",
      "artista": "Pink Floyd",
      "año": 1973,
      "genero": "Rock",
      "activo": true,
      "user_id": 1,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z",
      "details": {
        "foto": "/uploads/album-1642234567890.jpg",
        "descripcion": "Álbum conceptual sobre la experiencia humana"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "pages": 2
  }
}
\`\`\`

---

### 13. Crear Álbum
**POST** `/albums`

**Headers:**
\`\`\`
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`

**Body:**
\`\`\`json
{
  "titulo": "Abbey Road",
  "artista": "The Beatles",
  "año": 1969,
  "genero": "Rock"
}
\`\`\`

**Respuesta:**
\`\`\`json
{
  "success": true,
  "message": "Álbum creado exitosamente",
  "data": {
    "id": 2,
    "titulo": "Abbey Road",
    "artista": "The Beatles",
    "año": 1969,
    "genero": "Rock",
    "activo": true,
    "user_id": 1,
    "created_at": "2024-01-15T11:00:00.000Z",
    "updated_at": "2024-01-15T11:00:00.000Z"
  }
}
\`\`\`

---

### 14. Obtener Álbum por ID
**GET** `/albums/1`

### 15. Actualizar Álbum
**PUT** `/albums/1`

### 16. Eliminar Álbum
**DELETE** `/albums/1`

### 17. Subir Imagen de Álbum
**POST** `/albums/1/photo`

---

## 👥 GRUPOS MUSICALES

### 18. Listar Grupos
**GET** `/groups?page=1&limit=10`

**Headers:**
\`\`\`
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`

**Respuesta:**
\`\`\`json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre_grupo": "Los Rockeros",
      "genero_musical": "Rock Alternativo",
      "activo": true,
      "user_id": 1,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z",
      "details": {
        "foto": "/uploads/group-1642234567890.jpg",
        "descripcion": "Banda de rock alternativo formada en 2020",
        "miembros": ["Juan - Guitarra", "Pedro - Batería", "Ana - Bajo"]
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 8,
    "pages": 1
  }
}
\`\`\`

---

### 19. Crear Grupo
**POST** `/groups`

**Headers:**
\`\`\`
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`

**Body:**
\`\`\`json
{
  "nombre_grupo": "Metal Warriors",
  "genero_musical": "Heavy Metal"
}
\`\`\`

**Respuesta:**
\`\`\`json
{
  "success": true,
  "message": "Grupo creado exitosamente",
  "data": {
    "id": 2,
    "nombre_grupo": "Metal Warriors",
    "genero_musical": "Heavy Metal",
    "activo": true,
    "user_id": 1,
    "created_at": "2024-01-15T11:00:00.000Z",
    "updated_at": "2024-01-15T11:00:00.000Z"
  }
}
\`\`\`

---

### 20. Obtener Grupo por ID
**GET** `/groups/1`

### 21. Actualizar Grupo
**PUT** `/groups/1`

### 22. Eliminar Grupo
**DELETE** `/groups/1`

### 23. Subir Imagen de Grupo
**POST** `/groups/1/photo`

---

## 🎪 EVENTOS

### 24. Listar Eventos
**GET** `/events?page=1&limit=10`

**Headers:**
\`\`\`
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`

**Respuesta:**
\`\`\`json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre_evento": "Festival de Rock 2024",
      "genero_musical": "Rock",
      "fecha": "2024-06-15",
      "contacto": "eventos@rockfest.com",
      "capacidad": 5000,
      "estado": true,
      "user_id": 1,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z",
      "details": {
        "foto": "/uploads/event-1642234567890.jpg",
        "descripcion": "El festival de rock más grande del año",
        "ubicacion_detallada": "Parque Simón Bolívar, Bogotá",
        "precio": 150000
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 12,
    "pages": 2
  }
}
\`\`\`

---

### 25. Crear Evento
**POST** `/events`

**Headers:**
\`\`\`
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`

**Body:**
\`\`\`json
{
  "nombre_evento": "Concierto de Jazz",
  "genero_musical": "Jazz",
  "fecha": "2024-07-20",
  "contacto": "info@jazznight.com",
  "capacidad": 300
}
\`\`\`

**Respuesta:**
\`\`\`json
{
  "success": true,
  "message": "Evento creado exitosamente",
  "data": {
    "id": 2,
    "nombre_evento": "Concierto de Jazz",
    "genero_musical": "Jazz",
    "fecha": "2024-07-20",
    "contacto": "info@jazznight.com",
    "capacidad": 300,
    "estado": true,
    "user_id": 1,
    "created_at": "2024-01-15T11:00:00.000Z",
    "updated_at": "2024-01-15T11:00:00.000Z"
  }
}
\`\`\`

---

### 26. Obtener Evento por ID
**GET** `/events/1`

### 27. Actualizar Evento
**PUT** `/events/1`

### 28. Eliminar Evento
**DELETE** `/events/1`

### 29. Subir Imagen de Evento
**POST** `/events/1/photo`

---

## 🔍 ENDPOINT DE SALUD

### 30. Verificar Estado de la API
**GET** `/health`

**Respuesta:**
\`\`\`json
{
  "success": true,
  "message": "INDIEC API funcionando correctamente",
  "timestamp": "2024-01-15T11:30:00.000Z"
}
\`\`\`

---

## 📝 VALIDACIONES

### Géneros Musicales Válidos
- Rock
- Pop
- Jazz
- Clásica
- Electrónica
- Hip-Hop
- Reggae
- Metal

### Géneros de Usuario Válidos
- Masculino
- Femenino
- Otro

### Formato de Duración
- Formato: `MM:SS` (ejemplo: `3:45`, `10:30`)

### Tipos de Archivo Permitidos
- Imágenes: JPG, JPEG, PNG, GIF
- Tamaño máximo: 5MB

---

## ⚠️ CÓDIGOS DE ERROR COMUNES

- `400`: Datos de entrada inválidos
- `401`: No autorizado (token faltante o inválido)
- `403`: Token expirado
- `404`: Recurso no encontrado
- `409`: Recurso ya existe (email duplicado)
- `429`: Demasiadas peticiones (rate limit)
- `500`: Error interno del servidor

---

## 🧪 EJEMPLOS DE PRUEBA CON CURL

### Registro
\`\`\`bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@ejemplo.com",
    "password": "123456",
    "nombres": "Usuario",
    "apellidos": "Prueba",
    "genero": "Masculino",
    "fecha": "1990-01-01"
  }'
\`\`\`

### Login
\`\`\`bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@ejemplo.com",
    "password": "123456"
  }'
\`\`\`

### Crear Canción
\`\`\`bash
curl -X POST http://localhost:3000/api/music \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{
    "titulo": "Mi Canción",
    "album": "Mi Álbum",
    "duracion": "3:45",
    "año": 2024,
    "genero": "Rock"
  }'
\`\`\`

### Subir Imagen
\`\`\`bash
curl -X POST http://localhost:3000/api/music/1/photo \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -F "photo=@/ruta/a/tu/imagen.jpg"
\`\`\`

---

## 📊 COLECCIÓN DE POSTMAN

Para facilitar las pruebas, puedes importar esta colección en Postman:

1. Crear nueva colección llamada "INDIEC API"
2. Configurar variable de entorno `baseUrl` = `http://localhost:3000/api`
3. Configurar variable de entorno `token` para almacenar el JWT
4. Agregar todos los endpoints listados arriba

---

## 🔧 CONFIGURACIÓN DE DESARROLLO

### Variables de Entorno Requeridas
\`\`\`env
PORT=3000
NODE_ENV=development
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_DATABASE=indiec_db
MONGODB_URI=mongodb://localhost:27017/indiec_mongo
JWT_SECRET=indiec_super_secret_jwt_key_2024
JWT_EXPIRES_IN=24h
ENCRYPTION_KEY=indiec_32_char_encryption_key_123
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
LOG_LEVEL=info
\`\`\`

### Comandos Útiles
\`\`\`bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Ejecutar en producción
npm start

# Ver logs en tiempo real
tail -f logs/api.log
\`\`\`

---

¡La API INDIEC está lista para usar! 🎵🚀
