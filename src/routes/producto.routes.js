const { Router } = require('express');
const { crearProducto, obtenerProductos } = require('../controllers/producto.controller');
const { verificarRol } = require('../middlewares/auth.middleware');
const ROLES = require('../config/roles');

const router = Router();

const rolesCrear = [ROLES.ADMIN_SISTEMA, ROLES.ADMIN_EMPRESA];
const rolesTodos = [ROLES.ADMIN_SISTEMA, ROLES.ADMIN_EMPRESA, ROLES.ADMIN_SUCURSAL, ROLES.CAJERO, ROLES.COCINERO];

router.post('/', verificarRol(rolesCrear), crearProducto);
router.get('/', verificarRol(rolesTodos), obtenerProductos);

module.exports = router;
