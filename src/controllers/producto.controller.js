const logger = require('../utils/logger');
const Producto = require('../models/producto.model');
const Categoria = require('../models/categoria.model');
const PromocionItem = require('../models/promocion_item.model');
const Variante = require('../models/variante.model');

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
    const { nombre, descripcion, categoria_id, es_combo, sucursal_id, opcion_endulzante } = req.body;

    if (!sucursal_id) {
      return res.status(400).json({ error: 'sucursal_id es requerido' });
    }

    // Verificar si la categoría pertenece a la sucursal
    if (categoria_id) {
       const categoria = await Categoria.findOne({ where: { id: categoria_id, sucursal_id }});
       if (!categoria) {
           return res.status(400).json({ error: 'La categoría no existe o no pertenece a esta sucursal' });
       }
    }

    const nuevoProducto = await Producto.create({
      nombre,
      descripcion,
      categoria_id: categoria_id || null,
      sucursal_id,
      es_combo: es_combo || false,
      opcion_endulzante: opcion_endulzante || false
    });

    res.status(201).json({ data: nuevoProducto });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Error al crear el producto' });
  }
};

const obtenerProductos = async (req, res) => {
  try {
    const { sucursal_id } = req.query;

    if (!sucursal_id) {
      return res.status(400).json({ error: 'sucursal_id es requerido' });
    }

    const productos = await Producto.findAll({
      where: { sucursal_id },
      include: [
        { model: Categoria, as: 'categoria', attributes: ['id', 'nombre'] },
        { model: Variante, as: 'variantes' },
        { 
          model: PromocionItem, 
          as: 'promocion_items',
          include: [
            { model: Producto, as: 'producto_hijo', attributes: ['id', 'nombre'] },
            { model: Variante, as: 'variante_hija', attributes: ['id', 'nombre', 'precio'] }
          ]
        }
      ]
    });
    res.json({ data: productos });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los productos' });
  }
};

const agregarItemPromo = async (req, res) => {
  try {
    const { id } = req.params; // ID del producto padre (Combo)
    const { producto_hijo_id, variante_hijo_id, cantidad, sucursal_id } = req.body;

    if (!sucursal_id) {
      return res.status(400).json({ error: 'sucursal_id es requerido' });
    }

    const productoPadre = await Producto.findOne({ where: { id, sucursal_id }});
    if (!productoPadre) return res.status(404).json({ error: 'Producto padre no encontrado' });
    if (!productoPadre.es_combo) return res.status(400).json({ error: 'El producto padre no es un combo' });

    const productoHijo = await Producto.findOne({ where: { id: producto_hijo_id, sucursal_id }});
    if (!productoHijo) return res.status(404).json({ error: 'Producto hijo no encontrado' });

    const newItem = await PromocionItem.create({
      producto_padre_id: id,
      producto_hijo_id,
      variante_hijo_id: variante_hijo_id || null,
      cantidad: cantidad || 1
    });

    res.status(201).json({ data: newItem, mensaje: 'Ítem agregado a la promoción con éxito' });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Error al agregar ítem a la promoción' });
  }
};

const eliminarItemPromo = async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const { sucursal_id } = req.query;

    if (!sucursal_id) {
      return res.status(400).json({ error: 'sucursal_id es requerido' });
    }

    const productoPadre = await Producto.findOne({ where: { id, sucursal_id }});
    if (!productoPadre) return res.status(404).json({ error: 'Producto padre no encontrado' });

    const promoItem = await PromocionItem.findOne({ where: { id: itemId, producto_padre_id: id }});
    if (!promoItem) return res.status(404).json({ error: 'Ítem de promoción no encontrado' });

    await promoItem.destroy();
    res.json({ mensaje: 'Ítem de promoción eliminado con éxito' });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Error al eliminar ítem de promoción' });
  }
};

const actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { sucursal_id } = req.query;
    const { nombre, descripcion, categoria_id, activo, es_combo, opcion_endulzante } = req.body;

    if (!sucursal_id) {
      return res.status(400).json({ error: 'sucursal_id es requerido' });
    }

    const producto = await Producto.findOne({ where: { id, sucursal_id } });
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

    if (categoria_id) {
       const categoria = await Categoria.findOne({ where: { id: categoria_id, sucursal_id }});
       if (!categoria) {
           return res.status(400).json({ error: 'La categoría no existe o no pertenece a esta sucursal' });
       }
    }

    await producto.update({
      nombre: nombre !== undefined ? nombre : producto.nombre,
      descripcion: descripcion !== undefined ? descripcion : producto.descripcion,
      categoria_id: categoria_id !== undefined ? categoria_id : producto.categoria_id,
      activo: activo !== undefined ? activo : producto.activo,
      es_combo: es_combo !== undefined ? es_combo : producto.es_combo,
      opcion_endulzante: opcion_endulzante !== undefined ? opcion_endulzante : producto.opcion_endulzante
    });

    res.json({ data: producto, mensaje: 'Producto actualizado con éxito' });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Error al actualizar el producto' });
  }
};

const eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { sucursal_id } = req.query;

    if (!sucursal_id) {
      return res.status(400).json({ error: 'sucursal_id es requerido' });
    }

    const producto = await Producto.findOne({ where: { id, sucursal_id } });
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

    await producto.destroy();
    res.json({ mensaje: 'Producto eliminado con éxito' });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Error al eliminar el producto' });
  }
};

module.exports = { crearProducto, obtenerProductos, agregarItemPromo, eliminarItemPromo, actualizarProducto, eliminarProducto };