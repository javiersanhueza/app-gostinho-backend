const { Router } = require('express');
const { crearVariante, obtenerVariantesPorProducto, actualizarVariante, eliminarVariante } = require('../controllers/variante.controller');
const { verificarRol } = require('../middlewares/auth.middleware');
const ROLES = require('../config/roles');

const router = Router();

const rolesCrear = [ROLES.ADMIN_SISTEMA, ROLES.ADMIN_EMPRESA];
const rolesTodos = [ROLES.ADMIN_SISTEMA, ROLES.ADMIN_EMPRESA, ROLES.ADMIN_SUCURSAL, ROLES.CAJERO, ROLES.COCINERO];

// El post va a /api/v1/variantes
router.post('/', verificarRol(rolesCrear), crearVariante);
router.put('/:id', verificarRol(rolesCrear), actualizarVariante);
router.delete('/:id', verificarRol(rolesCrear), eliminarVariante);

// El get usa un sub-enrutamiento desde productos
router.get('/productos/:producto_id/variantes', verificarRol(rolesTodos), obtenerVariantesPorProducto);

module.exports = router;