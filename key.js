// key.js

module.exports = {
  PORT: 3001,

  MYSQL: {
    HOST: 'localhost',
    USER: 'root',
    PASSWORD: '12345',
    DATABASE: 'petpocket_sql',
  },

  MONGODB_URI: 'mongodb+srv://JavierVillarroel:1234567890@veterinaria.5onyg1t.mongodb.net/petpocket_mongo',

  JWT: {
    SECRET: 'tu_jwt_secret_muy_seguro_aqui',
  },

  ENCRYPTION_KEY: 'tu_clave_de_encriptacion_muy_segura_aqui',

  FRONTEND_URL: 'http://localhost:3000',

  NODE_ENV: 'production',
};
