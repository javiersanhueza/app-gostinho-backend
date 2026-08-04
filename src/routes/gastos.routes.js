const { Router } = require('express');
const {
  obtenerGastos,
  crearGastosBulk,
  actualizarGasto,
  borrarGasto,
  obtenerCategorias,
  crearCategoria,
  actualizarCategoria,
  borrarCategoria,
  obtenerProductosGasto,
  crearProductoGasto,
  actualizarProductoGasto,
  borrarProductoGasto,
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
router.post('/gastos/bulk', verificarRol(rolesTodos), crearGastosBulk);
router.put('/gastos/:id', verificarRol(rolesTodos), actualizarGasto);
router.delete('/gastos/:id', verificarRol(rolesAdmin), borrarGasto);

// --- CATEGORIAS DE GASTO ---
router.get('/categorias-gasto', verificarRol(rolesAdmin), obtenerCategorias);
router.post('/categorias-gasto', verificarRol(rolesAdmin), crearCategoria);
router.put('/categorias-gasto/:id', verificarRol(rolesAdmin), actualizarCategoria);
router.delete('/categorias-gasto/:id', verificarRol(rolesAdmin), borrarCategoria);

// --- PRODUCTOS DE GASTO ---
router.get('/productos-gasto', verificarRol(rolesAdmin), obtenerProductosGasto);
router.post('/productos-gasto', verificarRol(rolesAdmin), crearProductoGasto);
router.put('/productos-gasto/:id', verificarRol(rolesAdmin), actualizarProductoGasto);
router.delete('/productos-gasto/:id', verificarRol(rolesAdmin), borrarProductoGasto);

// --- UNIDADES DE MEDIDA ---
router.get('/unidades-medida', verificarRol(rolesAdmin), obtenerUnidades);
router.post('/unidades-medida', verificarRol(rolesAdmin), crearUnidad);

module.exports = router;
