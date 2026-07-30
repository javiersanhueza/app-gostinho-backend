const { Router } = require('express');
const {
  obtenerGastos,
  crearGastosBulk,
  borrarGasto,
  obtenerCategorias,
  crearCategoria,
  obtenerUnidades,
  crearUnidad
} = require('../controllers/gastos.controller');
const { verificarRol } = require('../middlewares/auth.middleware');
const ROLES = require('../config/roles');

const router = Router();
const rolesAdmin = [ROLES.ADMIN_SISTEMA, ROLES.ADMIN_EMPRESA, ROLES.ADMIN_SUCURSAL];
const rolesTodos = [ROLES.ADMIN_SISTEMA, ROLES.ADMIN_EMPRESA, ROLES.ADMIN_SUCURSAL, ROLES.CAJERO, ROLES.COCINERO];

// --- GASTOS ---
// Los ADMIN_SUCURSAL también pueden registrar gastos
router.get('/gastos', verificarRol(rolesAdmin), obtenerGastos);
router.post('/gastos/bulk', verificarRol(rolesAdmin), crearGastosBulk);
router.delete('/gastos/:id', verificarRol(rolesAdmin), borrarGasto);

// --- CATEGORIAS DE GASTO ---
router.get('/categorias-gasto', verificarRol(rolesAdmin), obtenerCategorias);
router.post('/categorias-gasto', verificarRol(rolesAdmin), crearCategoria);

// --- UNIDADES DE MEDIDA ---
router.get('/unidades-medida', verificarRol(rolesAdmin), obtenerUnidades);
router.post('/unidades-medida', verificarRol(rolesAdmin), crearUnidad);

module.exports = router;
