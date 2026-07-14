const { Router } = require('express');
const { crearVariante, obtenerVariantesPorProducto } = require('../controllers/variante.controller');
const { verificarRol } = require('../middlewares/auth.middleware');
const ROLES = require('../config/roles');

const router = Router();

const rolesCrear = [ROLES.ADMIN_SISTEMA, ROLES.ADMIN_EMPRESA];
const rolesTodos = [ROLES.ADMIN_SISTEMA, ROLES.ADMIN_EMPRESA, ROLES.ADMIN_SUCURSAL, ROLES.CAJERO, ROLES.COCINERO];

// El post va a /api/v1/variantes
router.post('/', verificarRol(rolesCrear), crearVariante);

// El get usa un sub-enrutamiento desde productos, pero lo registramos aquí para mantener orden.
// Se llamará desde app.js como: app.use('/api/v1', varianteRoutes)
// pero la ruta real para el GET será /productos/:producto_id/variantes
router.get('/productos/:producto_id/variantes', verificarRol(rolesTodos), obtenerVariantesPorProducto);

module.exports = router;