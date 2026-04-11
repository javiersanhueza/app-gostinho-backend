const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const usuariosRoutes = require('./routes/usuario.routes');
const restauranteRoutes = require('./routes/restaurante.routes');
const authRoutes = require('./routes/auth.routes');
const clienteRoutes = require('./routes/cliente.routes');
const planRoutes = require('./routes/plan.routes');

const app = express();

app.use(helmet());
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

app.use('/api/v1/usuarios', usuariosRoutes);
app.use('/api/v1/restaurantes', restauranteRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/clientes', clienteRoutes);
app.use('/api/v1/plan', planRoutes);

app.use((req, res, next) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
})

module.exports = app;
