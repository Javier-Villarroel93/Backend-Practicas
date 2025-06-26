// key.js

module.exports = {
  PORT: 3001,

  MYSQL: {
    HOST: 'localhost',
    USER: 'root',
    PASSWORD: '12345',
    DATABASE: 'petpocket_sql',
  },

  MONGODB_URI: 'mongodb://localhost:27017/petpocket_mongo',

  JWT: {
    SECRET: 'tu_jwt_secret_muy_seguro_aqui',
  },

  ENCRYPTION_KEY: 'tu_clave_de_encriptacion_muy_segura_aqui',

  FRONTEND_URL: 'http://localhost:3000',

  NODE_ENV: 'development',
};
