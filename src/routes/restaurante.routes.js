const { Router } = require('express');
const {
  crearRestaurante,
  inicializarSaaS,
  editarRestaurante,
  obtenerRestaurantes,
  toggleEstatusRestaurante
} = require('../controllers/restaurante.controller');

const { verificarRol } = require('../middlewares/auth.middleware');
const ROLES = require('../config/roles');
const router = Router();

const rolesAdmin = [ROLES.ADMIN_SISTEMA];

router.get('/', verificarRol(rolesAdmin), obtenerRestaurantes);
router.post('/', verificarRol(rolesAdmin), crearRestaurante);
router.put('/:id', verificarRol(rolesAdmin), editarRestaurante);
//router.delete('/:id', verificarRol(rolesAdmin), eliminarRestaurante);
router.patch('/:id/status', verificarRol(rolesAdmin), toggleEstatusRestaurante);
router.post('/inicializar', inicializarSaaS);

module.exports = router;
