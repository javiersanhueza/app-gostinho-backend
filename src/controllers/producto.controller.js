const Producto = require('../models/producto.model');
const Categoria = require('../models/categoria.model');

/**
 * @swagger
 * components:
 *   schemas:
 *     Producto:
 *       type: object
 *       required:
 *         - nombre
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         nombre:
 *           type: string
 *         descripcion:
 *           type: string
 *         imagen:
 *           type: string
 *         activo:
 *           type: boolean
 *         categoria_id:
 *           type: string
 *           format: uuid
 *         empresa_id:
 *           type: string
 *           format: uuid
 * 
 * tags:
 *   name: Productos
 *   description: Gestión de productos del menú
 */

/**
 * @swagger
 * /productos:
 *   post:
 *     summary: Crear un producto
 *     tags: [Productos]
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
 *               descripcion:
 *                 type: string
 *               categoria_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Producto creado
 */
const crearProducto = async (req, res) => {
  try {
    const { nombre, descripcion, categoria_id } = req.body;
    const creador = req.usuario;

    // Verificar si la categoría pertenece a la empresa
    if (categoria_id) {
       const categoria = await Categoria.findOne({ where: { id: categoria_id, empresa_id: creador.empresa_id }});
       if (!categoria) {
           return res.status(400).json({ error: 'La categoría no existe o no pertenece a tu empresa' });
       }
    }

    const nuevoProducto = await Producto.create({
      nombre,
      descripcion,
      categoria_id: categoria_id || null,
      empresa_id: creador.empresa_id
    });

    res.status(201).json({ data: nuevoProducto });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el producto' });
  }
};

/**
 * @swagger
 * /productos:
 *   get:
 *     summary: Listar todos los productos de la empresa
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de productos
 */
const obtenerProductos = async (req, res) => {
  try {
    const productos = await Producto.findAll({
      where: { empresa_id: req.usuario.empresa_id, activo: true },
      include: [{ model: Categoria, as: 'categoria', attributes: ['id', 'nombre'] }]
    });
    res.json({ data: productos });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los productos' });
  }
};

module.exports = { crearProducto, obtenerProductos };