const { Router } = require('express');
const {
  crearCliente,
  obtenerClientes,
  buscarPorTelefono,
  sumarPuntos,
  loginCliente,
  registroCliente,
  actualizarPerfilCliente,
  obtenerPerfilCliente,
  ajustarFidelidad
} = require('../controllers/cliente.controller');

const { verificarRol, verificarToken } = require('../middlewares/auth.middleware');
const ROLES = require('../config/roles');

const router = Router();

const rolesPermitidos = [ROLES.ADMIN_SISTEMA, ROLES.ADMIN_EMPRESA, ROLES.ADMIN_SUCURSAL, ROLES.CAJERO];

// Ruta PÚBLICA (Loyalty App)
router.post('/auth', loginCliente);
router.post('/auth/registro', registroCliente);
router.get('/me', verificarToken, obtenerPerfilCliente);
router.put('/me', verificarToken, actualizarPerfilCliente);

// Rutas PRIVADAS (POS y Admin)
router.post('/', verificarRol(rolesPermitidos), crearCliente);
router.get('/', verificarRol(rolesPermitidos), obtenerClientes);
router.get('/telefono/:telefono', verificarRol(rolesPermitidos), buscarPorTelefono);
router.put('/:id/puntos', verificarRol(rolesPermitidos), sumarPuntos);
router.post('/:id/ajustar-fidelidad', verificarRol(rolesPermitidos), ajustarFidelidad);

module.exports = router;
