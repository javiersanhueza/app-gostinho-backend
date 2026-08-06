const { Router } = require('express');
const { abrirComanda, agregarOrdenAComanda, cerrarComanda, obtenerComandasAbiertas, eliminarItemComanda } = require('../controllers/comanda.controller');
const { verificarRol } = require('../middlewares/auth.middleware');
const ROLES = require('../config/roles');

const router = Router();

const rolesOperativos = [ROLES.ADMIN_EMPRESA, ROLES.ADMIN_SUCURSAL, ROLES.CAJERO];

router.post('/', verificarRol(rolesOperativos), abrirComanda);
router.get('/', verificarRol(rolesOperativos), obtenerComandasAbiertas);
router.post('/:id/add-order', verificarRol(rolesOperativos), agregarOrdenAComanda);
router.put('/:id/close', verificarRol(rolesOperativos), cerrarComanda);
router.delete('/:id/item/:detalle_id', verificarRol(rolesOperativos), eliminarItemComanda);

module.exports = router;