const { Router } = require('express');
const {
  crearSabor, obtenerSabores, actualizarSabor, borrarSabor,
  crearFruta, obtenerFrutas, actualizarFruta, borrarFruta,
  crearTopping, obtenerToppings, actualizarTopping, borrarTopping,
  crearEndulzante, obtenerEndulzantes, actualizarEndulzante, borrarEndulzante
} = require('../controllers/ingredientes.controller');
const { verificarRol } = require('../middlewares/auth.middleware');
const ROLES = require('../config/roles');

const router = Router();
const rolesAdmin = [ROLES.ADMIN_SISTEMA, ROLES.ADMIN_EMPRESA];
const rolesTodos = [ROLES.ADMIN_SISTEMA, ROLES.ADMIN_EMPRESA, ROLES.ADMIN_SUCURSAL, ROLES.CAJERO, ROLES.COCINERO];

// Rutas para Sabores
router.post('/sabores', verificarRol(rolesAdmin), crearSabor);
router.get('/sabores', verificarRol(rolesTodos), obtenerSabores);
router.put('/sabores/:id', verificarRol(rolesAdmin), actualizarSabor);
router.delete('/sabores/:id', verificarRol(rolesAdmin), borrarSabor);

// Rutas para Frutas
router.post('/frutas', verificarRol(rolesAdmin), crearFruta);
router.get('/frutas', verificarRol(rolesTodos), obtenerFrutas);
router.put('/frutas/:id', verificarRol(rolesAdmin), actualizarFruta);
router.delete('/frutas/:id', verificarRol(rolesAdmin), borrarFruta);

// Rutas para Toppings
router.post('/toppings', verificarRol(rolesAdmin), crearTopping);
router.get('/toppings', verificarRol(rolesTodos), obtenerToppings);
router.put('/toppings/:id', verificarRol(rolesAdmin), actualizarTopping);
router.delete('/toppings/:id', verificarRol(rolesAdmin), borrarTopping);

// Rutas para Endulzantes
router.post('/endulzantes', verificarRol(rolesAdmin), crearEndulzante);
router.get('/endulzantes', verificarRol(rolesTodos), obtenerEndulzantes);
router.put('/endulzantes/:id', verificarRol(rolesAdmin), actualizarEndulzante);
router.delete('/endulzantes/:id', verificarRol(rolesAdmin), borrarEndulzante);

module.exports = router;
