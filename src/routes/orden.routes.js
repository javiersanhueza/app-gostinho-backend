const { Router } = require('express');
const { crearOrden, obtenerOrdenes, reclamarPuntos } = require('../controllers/orden.controller');
const { verificarRol } = require('../middlewares/auth.middleware');
const ROLES = require('../config/roles');

const router = Router();

const rolesCrear = [ROLES.ADMIN_SUCURSAL, ROLES.CAJERO];
const rolesVer = [ROLES.ADMIN_SISTEMA, ROLES.ADMIN_EMPRESA, ROLES.ADMIN_SUCURSAL, ROLES.CAJERO, ROLES.COCINERO];
const rolesCliente = [ROLES.CLIENTE];

router.post('/', verificarRol(rolesCrear), crearOrden);
router.get('/', verificarRol(rolesVer), obtenerOrdenes);

// Endpoint A: Reclamar puntos escaneando el QR (Usado por los comensales)
router.post('/reclamar-puntos', verificarRol(rolesCliente), reclamarPuntos);

module.exports = router;
