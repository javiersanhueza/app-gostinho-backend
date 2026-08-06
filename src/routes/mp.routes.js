const { Router } = require('express');
const { getDispositivos, crearIntentoPago, verificarEstadoPago, cancelarIntentoPago } = require('../controllers/mp.controller');
const { verificarRol } = require('../middlewares/auth.middleware');
const ROLES = require('../config/roles');

const router = Router();

const rolesOperativos = [ROLES.ADMIN_EMPRESA, ROLES.ADMIN_SUCURSAL, ROLES.CAJERO];

router.get('/dispositivos', verificarRol(rolesOperativos), getDispositivos);
router.post('/pago', verificarRol(rolesOperativos), crearIntentoPago);
router.get('/pago/:orderId/estado', verificarRol(rolesOperativos), verificarEstadoPago);
router.post('/pago/:orderId/cancelar', verificarRol(rolesOperativos), cancelarIntentoPago);

module.exports = router;
