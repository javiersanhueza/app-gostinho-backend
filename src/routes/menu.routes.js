const { Router } = require('express');
const { obtenerMenuPublico } = require('../controllers/menu.controller');

const router = Router();

// Ruta pública (sin middleware de autenticación)
router.get('/:slug', obtenerMenuPublico);

module.exports = router;
