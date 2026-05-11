const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Gostinho SaaS API',
      version: '1.0.0',
      description: 'API para la gestión multitenant de Gostinho Food Truck',
    },
    servers: [
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Servidor Local',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'], // Donde Swagger buscará la documentación
};

const specs = swaggerJsdoc(options);
module.exports = specs;
