const Categoria = require('../models/categoria.model');
const ROLES = require('../config/roles');

/**
 * @swagger
 * components:
 *   schemas:
 *     Categoria:
 *       type: object
 *       required:
 *         - nombre
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         nombre:
 *           type: string
 *         orden:
 *           type: integer
 *         activa:
 *           type: boolean
 *         empresa_id:
 *           type: string
 *           format: uuid
 * 
 * tags:
 *   name: Categorias
 *   description: Gestión de categorías del menú
 */

/**
 * @swagger
 * /categorias:
 *   post:
 *     summary: Crear una categoría de menú
 *     tags: [Categorias]
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
 *             properties:
 *               nombre:
 *                 type: string
 *               orden:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Categoría creada
 */
const crearCategoria = async (req, res) => {
  try {
    const { nombre, orden } = req.body;
    const creador = req.usuario;

    const nuevaCategoria = await Categoria.create({
      nombre,
      orden: orden || 10,
      empresa_id: creador.empresa_id
    });

    res.status(201).json({ data: nuevaCategoria });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear la categoría' });
  }
};

/**
 * @swagger
 * /categorias:
 *   get:
 *     summary: Listar todas las categorías de la empresa
 *     tags: [Categorias]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de categorías
 */
const obtenerCategorias = async (req, res) => {
  try {
    const categorias = await Categoria.findAll({
      where: { empresa_id: req.usuario.empresa_id, activa: true },
      order: [['orden', 'ASC']]
    });
    res.json({ data: categorias });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las categorías' });
  }
};

module.exports = { crearCategoria, obtenerCategorias };