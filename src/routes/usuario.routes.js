const { Router } = require('express');
const {
  crearUsuario,
  obtenerUsuarios,
  editarUsuario,
  eliminarUsuario
} = require('../controllers/usuario.controller');
const { verificarRol } = require('../middlewares/auth.middleware');
const ROLES = require('../config/roles');

const router = Router();

const rolesPermitidos = [ROLES.ADMIN_SISTEMA, ROLES.ADMIN_EMPRESA];

// Swagger Documentación de Usuarios

/**
 * @swagger
 * components:
 *   schemas:
 *     Usuario:
 *       type: object
 *       required:
 *         - nombre
 *         - password
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         nombre:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         rol:
 *           type: string
 *           enum: [ADMIN_SISTEMA, ADMIN_EMPRESA, ADMIN_SUCURSAL, CAJERO, COCINERO]
 *         activo:
 *           type: boolean
 *         empresa_id:
 *           type: string
 *           format: uuid
 *         sucursal_id:
 *           type: string
 *           format: uuid
 * 
 * tags:
 *   name: Usuarios
 *   description: Gestión de usuarios del sistema y locales
 */

/**
 * @swagger
 * /usuarios:
 *   get:
 *     summary: Obtener lista de usuarios
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios obtenida
 *   post:
 *     summary: Crear un nuevo usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - password
 *             properties:
 *               nombre:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               rol:
 *                 type: string
 *               empresa_id:
 *                 type: string
 *                 format: uuid
 *               sucursal_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 */
router.post('/', verificarRol(rolesPermitidos), crearUsuario);
router.get('/', verificarRol(rolesPermitidos), obtenerUsuarios);

/**
 * @swagger
 * /usuarios/{id}:
 *   put:
 *     summary: Editar un usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               rol:
 *                 type: string
 *               activo:
 *                 type: boolean
 *               empresa_id:
 *                 type: string
 *                 format: uuid
 *               sucursal_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Usuario actualizado
 *   delete:
 *     summary: Desactivar un usuario (Soft Delete)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Usuario desactivado
 */
router.put('/:id', verificarRol(rolesPermitidos), editarUsuario);
router.delete('/:id', verificarRol(rolesPermitidos), eliminarUsuario);

module.exports = router;
