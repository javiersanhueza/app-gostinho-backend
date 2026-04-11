const { Router } = require('express');
const {
  crearRestaurante,
  inicializarSaaS,
  editarRestaurante,
  obtenerRestaurantes,
  toggleEstatusRestaurante
} = require('../controllers/restaurante.controller');

const { verificarRol } = require('../middlewares/auth.middleware');
const router = Router();

router.get('/', verificarRol(['ADMIN_SISTEMA']), obtenerRestaurantes);
router.post('/', verificarRol(['ADMIN_SISTEMA']), crearRestaurante);
router.put('/:id', verificarRol(['ADMIN_SISTEMA']), editarRestaurante);
//router.delete('/:id', verificarRol(['ADMIN_SISTEMA']), eliminarRestaurante);
router.patch('/:id/status', verificarRol(['ADMIN_SISTEMA']), toggleEstatusRestaurante);
router.post('/inicializar', inicializarSaaS);

module.exports = router;
