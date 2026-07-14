const { Router } = require('express');
const {
  crearSabor, obtenerSabores,
  crearFruta, obtenerFrutas,
  crearTopping, obtenerToppings
} = require('../controllers/ingredientes.controller');
const { verificarRol } = require('../middlewares/auth.middleware');
const ROLES = require('../config/roles');

const router = Router();
const rolesAdmin = [ROLES.ADMIN_SISTEMA, ROLES.ADMIN_EMPRESA];
const rolesTodos = [ROLES.ADMIN_SISTEMA, ROLES.ADMIN_EMPRESA, ROLES.ADMIN_SUCURSAL, ROLES.CAJERO, ROLES.COCINERO];

// Rutas para Sabores
router.post('/sabores', verificarRol(rolesAdmin), crearSabor);
router.get('/sabores', verificarRol(rolesTodos), obtenerSabores);

// Rutas para Frutas
router.post('/frutas', verificarRol(rolesAdmin), crearFruta);
router.get('/frutas', verificarRol(rolesTodos), obtenerFrutas);

// Rutas para Toppings
router.post('/toppings', verificarRol(rolesAdmin), crearTopping);
router.get('/toppings', verificarRol(rolesTodos), obtenerToppings);

module.exports = router;
