const express = require('express');
const router = express.Router();
const { verificarRol } = require('../middlewares/auth.middleware');
const ROLES = require('../config/roles');
const {
  getSucursales,
  getSucursalById,
  createSucursal,
  updateSucursal,
  deleteSucursal
} = require('../controllers/sucursal.controller');

// Solo ADMIN_SISTEMA y ADMIN_EMPRESA pueden gestionar sucursales
const rolesPermitidos = [ROLES.ADMIN_SISTEMA, ROLES.ADMIN_EMPRESA];

router.get('/', verificarRol(rolesPermitidos), getSucursales);
router.get('/:id', verificarRol(rolesPermitidos), getSucursalById);
router.post('/', verificarRol(rolesPermitidos), createSucursal);
router.put('/:id', verificarRol(rolesPermitidos), updateSucursal);
router.delete('/:id', verificarRol(rolesPermitidos), deleteSucursal);

module.exports = router;
