const { Router } = require('express');
const { crearCategoria, obtenerCategorias } = require('../controllers/categoria.controller');
const { verificarRol } = require('../middlewares/auth.middleware');
const ROLES = require('../config/roles');

const router = Router();

// Solo ADMIN_EMPRESA y ADMIN_SISTEMA pueden gestionar el catálogo a nivel macro
const rolesCrear = [ROLES.ADMIN_SISTEMA, ROLES.ADMIN_EMPRESA];
// Todos los empleados pueden ver el menú para operar
const rolesTodos = [ROLES.ADMIN_SISTEMA, ROLES.ADMIN_EMPRESA, ROLES.ADMIN_SUCURSAL, ROLES.CAJERO, ROLES.COCINERO];

router.post('/', verificarRol(rolesCrear), crearCategoria);
router.get('/', verificarRol(rolesTodos), obtenerCategorias);

module.exports = router;
