const express = require('express');
const router = express.Router();
const { verificarRol } = require('../middlewares/auth.middleware');
const { obtenerConfig, actualizarConfig } = require('../controllers/fidelidad.controller');

const rolesPermitidos = ['ADMIN_SISTEMA', 'ADMIN_EMPRESA'];

router.get('/config', verificarRol(rolesPermitidos), obtenerConfig);
router.put('/config', verificarRol(rolesPermitidos), actualizarConfig);

module.exports = router;
