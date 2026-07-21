const { Router } = require('express');
const { getMyProfile, updateMyProfile } = require('../controllers/profile.controller');
const { verificarRol } = require('../middlewares/auth.middleware');
const ROLES = require('../config/roles');

const router = Router();

// Todos los roles autenticados pueden acceder a su propio perfil
const todosLosRoles = Object.values(ROLES);

router.get('/me', verificarRol(todosLosRoles), getMyProfile);
router.put('/me', verificarRol(todosLosRoles), updateMyProfile);

module.exports = router;
