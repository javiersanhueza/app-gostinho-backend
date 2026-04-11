const { Router } = require('express');
const {
  obtenerPlanes,
  crearPlan,
  editarPlan,
  toggleEstadoPlan
} = require('../controllers/plan.controller');


const { verificarRol } = require('../middlewares/auth.middleware');

const router = Router();

const rolesPermitidos = ['ADMIN_SISTEMA'];

router.post('/', verificarRol(rolesPermitidos), crearPlan);
router.get('/', verificarRol(rolesPermitidos), obtenerPlanes);
router.patch('/:id/status', verificarRol(rolesPermitidos), toggleEstadoPlan);
router.put('/:id', verificarRol(rolesPermitidos), editarPlan);

module.exports = router;