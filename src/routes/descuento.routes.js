const express = require('express');
const { 
  crearDescuento, 
  obtenerDescuentos, 
  actualizarDescuento, 
  eliminarDescuento 
} = require('../controllers/descuento.controller');
const { requireAuth } = require('../middlewares/auth');

const router = express.Router();

router.use(requireAuth);

router.post('/', crearDescuento);
router.get('/', obtenerDescuentos);
router.put('/:id', actualizarDescuento);
router.delete('/:id', eliminarDescuento);

module.exports = router;
