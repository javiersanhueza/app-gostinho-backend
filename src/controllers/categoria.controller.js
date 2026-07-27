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

/**
 * @swagger
 * /categorias/{id}:
 *   put:
 *     summary: Actualizar una categoría
 *     tags: [Categorias]
 *     security:
 *       - bearerAuth: []
 */
const actualizarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, orden, activa } = req.body;
    const empresa_id = req.usuario.empresa_id;

    const categoria = await Categoria.findOne({ where: { id, empresa_id } });
    if (!categoria) return res.status(404).json({ error: 'Categoría no encontrada' });

    await categoria.update({ nombre, orden, activa });
    res.json({ data: categoria });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar la categoría' });
  }
};

/**
 * @swagger
 * /categorias/{id}:
 *   delete:
 *     summary: Eliminar una categoría
 *     tags: [Categorias]
 *     security:
 *       - bearerAuth: []
 */
const borrarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const empresa_id = req.usuario.empresa_id;

    const categoria = await Categoria.findOne({ where: { id, empresa_id } });
    if (!categoria) return res.status(404).json({ error: 'Categoría no encontrada' });

    await categoria.destroy();
    res.json({ mensaje: 'Categoría eliminada con éxito' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la categoría' });
  }
};

/**
 * @swagger
 * /categorias/reordenar:
 *   put:
 *     summary: Reordenar categorías en masa
 *     tags: [Categorias]
 *     security:
 *       - bearerAuth: []
 */
const reordenarCategorias = async (req, res) => {
  try {
    const { categorias } = req.body; // array de { id, orden }
    const empresa_id = req.usuario.empresa_id;

    // Actualizar en lote
    const promesas = categorias.map(cat => 
      Categoria.update({ orden: cat.orden }, { where: { id: cat.id, empresa_id } })
    );

    await Promise.all(promesas);

    res.json({ mensaje: 'Categorías reordenadas con éxito' });
  } catch (error) {
    res.status(500).json({ error: 'Error al reordenar las categorías' });
  }
};

module.exports = { crearCategoria, obtenerCategorias, actualizarCategoria, borrarCategoria, reordenarCategorias };