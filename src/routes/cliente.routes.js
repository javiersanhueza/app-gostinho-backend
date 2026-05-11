
const { Router } = require('express');
const {
  crearCliente,
  obtenerClientes,
  buscarPorTelefono,
  sumarPuntos
} = require('../controllers/cliente.controller');


const { verificarRol } = require('../middlewares/auth.middleware');
const ROLES = require('../config/roles');

const router = Router();

const rolesPermitidos = [ROLES.ADMIN_SISTEMA, ROLES.ADMIN_EMPRESA, ROLES.ADMIN_SUCURSAL, ROLES.CAJERO];

router.post('/', verificarRol(rolesPermitidos), crearCliente);
router.get('/', verificarRol(rolesPermitidos), obtenerClientes);
router.get('/telefono/:telefono', verificarRol(rolesPermitidos), buscarPorTelefono);
router.put('/:id/puntos', verificarRol(rolesPermitidos), sumarPuntos);

module.exports = router;
