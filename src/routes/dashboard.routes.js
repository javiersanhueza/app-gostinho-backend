const { Router } = require('express');
const { getAdminSistemaDashboard, getEmpresaDashboard } = require('../controllers/dashboard.controller');
const { verificarRol } = require('../middlewares/auth.middleware');
const ROLES = require('../config/roles');

const router = Router();

// Proteger la ruta para que solo sea accesible por el ADMIN_SISTEMA
router.get('/admin-sistema', verificarRol([ROLES.ADMIN_SISTEMA]), getAdminSistemaDashboard);

// Ruta para el dashboard de empresa/sucursal (accesible por roles de empresa)
router.get('/empresa', verificarRol([ROLES.ADMIN_EMPRESA, ROLES.ADMIN_SUCURSAL, ROLES.CAJERO, ROLES.COCINERO]), getEmpresaDashboard);

module.exports = router;
