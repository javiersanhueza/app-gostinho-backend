const { Router } = require('express');
const { crearProducto, obtenerProductos, agregarItemPromo, eliminarItemPromo } = require('../controllers/producto.controller');
const { verificarRol } = require('../middlewares/auth.middleware');
const ROLES = require('../config/roles');

const router = Router();

const rolesCrear = [ROLES.ADMIN_SISTEMA, ROLES.ADMIN_EMPRESA];
const rolesTodos = [ROLES.ADMIN_SISTEMA, ROLES.ADMIN_EMPRESA, ROLES.ADMIN_SUCURSAL, ROLES.CAJERO, ROLES.COCINERO];

router.post('/', verificarRol(rolesCrear), crearProducto);
router.get('/', verificarRol(rolesTodos), obtenerProductos);

// Rutas de Promociones (Combos)
router.post('/:id/promociones', verificarRol(rolesCrear), agregarItemPromo);
router.delete('/:id/promociones/:itemId', verificarRol(rolesCrear), eliminarItemPromo);

// Modificación de Producto completo
const { actualizarProducto, eliminarProducto } = require('../controllers/producto.controller');
router.put('/:id', verificarRol(rolesCrear), actualizarProducto);
router.delete('/:id', verificarRol(rolesCrear), eliminarProducto);

module.exports = router;
