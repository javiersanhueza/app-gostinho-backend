const express = require('express');
const router = express.Router();
const { obtenerPlanes, crearPlan, editarPlan, toggleEstadoPlan } = require('../controllers/plan.controller');
const { verificarRol } = require('../middlewares/auth.middleware');

const ROLES = require('../config/roles');

const rolesAdmin = [ROLES.ADMIN_SISTEMA];

/**
 * @swagger
 * /plan:
 *   get:
 *     summary: Listar todos los planes
 *     tags: [Planes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de planes obtenida
 *   post:
 *     summary: Crear un nuevo plan
 *     tags: [Planes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, precioMensual]
 *             properties:
 *               nombre: { type: string, example: "Plan Premium" }
 *               descripcion: { type: string }
 *               precioMensual: { type: number, example: 29990 }
 *               maxSucursales: { type: number, example: 5 }
 *               maxUsuarios: { type: number, example: 10 }
 *     responses:
 *       201:
 *         description: Plan creado
 */
router.get('/', verificarRol(rolesAdmin), obtenerPlanes);
router.post('/', verificarRol(rolesAdmin), crearPlan);

/**
 * @swagger
 * /plan/{id}:
 *   put:
 *     summary: Editar un plan
 *     tags: [Planes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Plan actualizado
 *
 * /plan/{id}/status:
 *   patch:
 *     summary: Activar/Desactivar un plan (Soft delete)
 *     tags: [Planes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Estado cambiado exitosamente
 */
router.put('/:id', verificarRol(rolesAdmin), editarPlan);
router.patch('/:id/status', verificarRol(rolesAdmin), toggleEstadoPlan);

module.exports = router;
