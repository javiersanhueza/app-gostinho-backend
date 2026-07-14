const Variante = require('../models/variante.model');
const Producto = require('../models/producto.model');

/**
 * @swagger
 * components:
 *   schemas:
 *     Variante:
 *       type: object
 *       required:
 *         - nombre
 *         - precio
 *         - producto_id
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         nombre:
 *           type: string
 *           description: Ej Normal, Grande, Familiar
 *         precio:
 *           type: integer
 *         stock:
 *           type: boolean
 *         producto_id:
 *           type: string
 *           format: uuid
 * 
 * tags:
 *   name: Variantes
 *   description: Gestión de precios y tamaños de productos
 */

/**
 * @swagger
 * /variantes:
 *   post:
 *     summary: Crear una variante (tamaño/precio) para un producto
 *     tags: [Variantes]
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
 *               - precio
 *               - producto_id
 *             properties:
 *               nombre:
 *                 type: string
 *               precio:
 *                 type: integer
 *               stock:
 *                 type: boolean
 *               producto_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Variante creada
 */
const crearVariante = async (req, res) => {
  try {
    const { nombre, precio, stock, producto_id } = req.body;
    const creador = req.usuario;

    // Verificar que el producto pertenece a la empresa del usuario
    const producto = await Producto.findOne({ 
      where: { id: producto_id, empresa_id: creador.empresa_id } 
    });

    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado en tu empresa' });
    }

    const nuevaVariante = await Variante.create({
      nombre,
      precio,
      stock: stock !== undefined ? stock : true,
      producto_id
    });

    res.status(201).json({ data: nuevaVariante });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear la variante' });
  }
};

/**
 * @swagger
 * /productos/{producto_id}/variantes:
 *   get:
 *     summary: Obtener todas las variantes de un producto específico
 *     tags: [Variantes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: producto_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Lista de variantes (precios) del producto
 */
const obtenerVariantesPorProducto = async (req, res) => {
  try {
    const { producto_id } = req.params;
    
    // Aquí no filtramos por empresa_id directamente en Variante, 
    // porque el producto ya está aislado, pero es buena práctica verificar el producto primero.
    const producto = await Producto.findOne({ 
        where: { id: producto_id, empresa_id: req.usuario.empresa_id } 
    });

    if (!producto) {
        return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const variantes = await Variante.findAll({
      where: { producto_id },
      order: [['precio', 'ASC']]
    });

    res.json({ data: variantes });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener variantes' });
  }
};

module.exports = { crearVariante, obtenerVariantesPorProducto };