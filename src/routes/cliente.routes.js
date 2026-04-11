
const { Router } = require('express');
const {
  crearCliente,
  obtenerClientes,
  buscarPorTelefono,
  sumarPuntos
} = require('../controllers/cliente.controller');


const { verificarRol } = require('../middlewares/auth.middleware');

const router = Router();

const rolesPermitidos = ['ADMIN_SISTEMA', 'ADMIN_LOCAL', 'CAJERO'];

router.post('/', verificarRol(rolesPermitidos), crearCliente);
router.get('/', verificarRol(rolesPermitidos), obtenerClientes);
router.get('/telefono/:telefono', verificarRol(rolesPermitidos), buscarPorTelefono);
router.put('/:id/puntos', verificarRol(rolesPermitidos), sumarPuntos);

module.exports = router;