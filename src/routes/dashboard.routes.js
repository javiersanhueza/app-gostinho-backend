const { Router } = require('express');
const { getAdminSistemaDashboard } = require('../controllers/dashboard.controller');
const { verificarRol } = require('../middlewares/auth.middleware');
const ROLES = require('../config/roles');

const router = Router();

// Proteger la ruta para que solo sea accesible por el ADMIN_SISTEMA
router.get('/admin-sistema', verificarRol([ROLES.ADMIN_SISTEMA]), getAdminSistemaDashboard);

module.exports = router;
