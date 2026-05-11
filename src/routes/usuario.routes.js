const { Router } = require('express');
const {
  crearUsuario,
  obtenerUsuarios,
  editarUsuario,
  eliminarUsuario
} = require('../controllers/usuario.controller');
const { verificarRol } = require('../middlewares/auth.middleware');
const ROLES = require('../config/roles');

const router = Router();

const rolesPermitidos = [ROLES.ADMIN_SISTEMA, ROLES.ADMIN_LOCAL];

router.post('/', verificarRol(rolesPermitidos), crearUsuario);
router.get('/', verificarRol(rolesPermitidos), obtenerUsuarios);
router.put('/:id', verificarRol(rolesPermitidos), editarUsuario);
router.delete('/:id', verificarRol(rolesPermitidos), eliminarUsuario);

module.exports = router;
