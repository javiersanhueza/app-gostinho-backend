const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

const usuariosRoutes = require('./routes/usuario.routes');
const restauranteRoutes = require('./routes/restaurante.routes');
const authRoutes = require('./routes/auth.routes');
const clienteRoutes = require('./routes/cliente.routes');
const planRoutes = require('./routes/plan.routes');
const empresaRoutes = require('./routes/empresa.routes');
const sucursalRoutes = require('./routes/sucursal.routes');

const app = express();

app.use(helmet());
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

// Configuramos una ruta estática extra para servir un JS externo de inyección
app.get('/swagger-inject.js', (req, res) => {
  res.type('application/javascript');
  res.send(`
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
      const response = await originalFetch.apply(this, args);
      const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url ? args[0].url : '');
      
      if (url.includes('/auth/login') && response.ok) {
        response.clone().json().then(data => {
          if (data && data.token && window.ui) {
             window.ui.authActions.authorize({
               bearerAuth: {
                 name: "bearerAuth",
                 schema: {
                   type: "http",
                   in: "header",
                   name: "Authorization",
                   description: ""
                 },
                 value: data.token
               }
             });
             console.log("Token inyectado correctamente en Swagger UI");
          }
        }).catch(err => console.error("Error al interceptar token:", err));
      }
      return response;
    };
  `);
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  swaggerOptions: {
    persistAuthorization: true,
  },
  customSiteTitle: "Gostinho API Docs",
  customJs: '/swagger-inject.js' // Pasamos la URL del script externo en lugar de un string en línea
}));

app.use('/api/v1/usuarios', usuariosRoutes);
app.use('/api/v1/restaurantes', restauranteRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/clientes', clienteRoutes);
app.use('/api/v1/plan', planRoutes);
app.use('/api/v1/empresas', empresaRoutes);
app.use('/api/v1/sucursales', sucursalRoutes);

app.use((req, res, next) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
})

module.exports = app;
