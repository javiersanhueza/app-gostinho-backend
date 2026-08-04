const express = require('express');
const { 
  crearDescuento, 
  obtenerDescuentos, 
  actualizarDescuento, 
  eliminarDescuento 
} = require('../controllers/descuento.controller');
const { verificarRol } = require('../middlewares/auth.middleware');
const ROLES = require('../config/roles');

const router = express.Router();

const rolesCrear = [ROLES.ADMIN_SISTEMA, ROLES.ADMIN_EMPRESA];
const rolesTodos = [ROLES.ADMIN_SISTEMA, ROLES.ADMIN_EMPRESA, ROLES.ADMIN_SUCURSAL, ROLES.CAJERO];

router.post('/', verificarRol(rolesCrear), crearDescuento);
router.get('/', verificarRol(rolesTodos), obtenerDescuentos);
router.put('/:id', verificarRol(rolesCrear), actualizarDescuento);
router.delete('/:id', verificarRol(rolesCrear), eliminarDescuento);

module.exports = router;
