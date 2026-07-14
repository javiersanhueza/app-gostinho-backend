const { Router } = require('express');
const { crearGrupo, agregarItemAGrupo, obtenerConfiguracionProducto } = require('../controllers/grupo_opciones.controller');
const { verificarRol } = require('../middlewares/auth.middleware');
const ROLES = require('../config/roles');

const router = Router();

const rolesAdmin = [ROLES.ADMIN_SISTEMA, ROLES.ADMIN_EMPRESA];
const rolesTodos = [ROLES.ADMIN_SISTEMA, ROLES.ADMIN_EMPRESA, ROLES.ADMIN_SUCURSAL, ROLES.CAJERO, ROLES.COCINERO];

// Rutas para gestionar los grupos
router.post('/grupo-opciones', verificarRol(rolesAdmin), crearGrupo);
router.post('/grupo-opciones/:grupo_id/add-item', verificarRol(rolesAdmin), agregarItemAGrupo);

// Ruta para que el frontend consulte la configuración completa de un producto
router.get('/productos/:id/configuracion', verificarRol(rolesTodos), obtenerConfiguracionProducto);

module.exports = router;
