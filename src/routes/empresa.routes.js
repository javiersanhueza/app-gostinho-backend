const express = require('express');
const router = express.Router();
const empresaController = require('../controllers/empresa.controller');

const { verificarRol } = require('../middlewares/auth.middleware');
const ROLES = require('../config/roles');

const rolesPermitidos = [ROLES.ADMIN_SISTEMA];

/**
 * @swagger
 * tags:
 *   name: Empresas
 *   description: Gestión administrativa de empresas (Solo para ADMIN_SISTEMA)
 */

/**
 * @swagger
 * /empresas:
 *   get:
 *     summary: Obtener todas las empresas
 *     description: Retorna una lista de todas las empresas registradas en el SaaS con sus respectivos planes.
 *     security:
 *       - bearerAuth: []
 *     tags: [Empresas]
 *     responses:
 *       200:
 *         description: Arreglo de empresas obtenido con éxito.
 *       401:
 *         description: No autorizado.
 *
 *   post:
 *     summary: Crear una nueva empresa
 *     description: Registra una nueva empresa o cliente en el sistema.
 *     security:
 *       - bearerAuth: []
 *     tags: [Empresas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - plan_id
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Gostinho Food Truck"
 *               rut:
 *                 type: string
 *                 example: "77.123.456-k"
 *               plan_id:
 *                 type: string
 *                 description: UUID del plan asociado (obtener de la tabla planes)
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               fechaVencimiento:
 *                 type: string
 *                 format: date-time
 *                 example: "2027-01-01T00:00:00Z"
 *     responses:
 *       201:
 *         description: Empresa creada exitosamente.
 */
router.get('/', verificarRol(rolesPermitidos), empresaController.getEmpresas);
router.post('/', verificarRol(rolesPermitidos), empresaController.createEmpresa);

/**
 * @swagger
 * /empresas/{id}:
 *   get:
 *     summary: Obtener una empresa por ID
 *     security:
 *       - bearerAuth: []
 *     tags: [Empresas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID de la empresa a consultar
 *     responses:
 *       200:
 *         description: Datos de la empresa encontrados.
 *       404:
 *         description: Empresa no encontrada.
 *
 *   put:
 *     summary: Editar una empresa
 *     description: Actualiza los datos de una empresa existente.
 *     security:
 *       - bearerAuth: []
 *     tags: [Empresas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               suscripcionActiva:
 *                 type: boolean
 *               plan_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Empresa actualizada correctamente.
 *       404:
 *         description: Empresa no encontrada.
 *
 *   delete:
 *     summary: Eliminar una empresa
 *     description: Elimina permanentemente una empresa y sus sucursales (Cascade).
 *     security:
 *       - bearerAuth: []
 *     tags: [Empresas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Empresa eliminada.
 *       404:
 *         description: Empresa no encontrada.
 */

router.get('/:id', verificarRol(rolesPermitidos), empresaController.getEmpresaById);
router.put('/:id', verificarRol(rolesPermitidos), empresaController.updateEmpresa);
router.delete('/:id', verificarRol(rolesPermitidos), empresaController.deleteEmpresa);

module.exports = router;
