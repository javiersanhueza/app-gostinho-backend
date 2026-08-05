const logger = require('../utils/logger');
const Variante = require('../models/variante.model');
const Producto = require('../models/producto.model');

const crearVariante = async (req, res) => {
  try {
    const { nombre, precio, stock, producto_id, max_sabores, max_frutas, max_toppings_gratis, max_toppings_pago, max_salsas } = req.body;
    const { sucursal_id } = req.query;

    if (!sucursal_id) {
      return res.status(400).json({ error: 'sucursal_id es requerido' });
    }

    const producto = await Producto.findOne({ 
      where: { id: producto_id, sucursal_id } 
    });

    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const nuevaVariante = await Variante.create({
      nombre,
      precio,
      stock: stock !== undefined ? stock : true,
      max_sabores, max_frutas, max_toppings_gratis, max_toppings_pago, max_salsas,
      producto_id
    });

    res.status(201).json({ data: nuevaVariante, mensaje: 'Variante creada con éxito' });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Error al crear la variante' });
  }
};

const obtenerVariantesPorProducto = async (req, res) => {
  try {
    const { producto_id } = req.params;
    const { sucursal_id } = req.query;

    if (!sucursal_id) {
      return res.status(400).json({ error: 'sucursal_id es requerido' });
    }

    const producto = await Producto.findOne({ 
        where: { id: producto_id, sucursal_id } 
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

const actualizarVariante = async (req, res) => {
  try {
    const { id } = req.params;
    const { sucursal_id } = req.query;
    const { nombre, precio, stock, max_sabores, max_frutas, max_toppings_gratis, max_toppings_pago, max_salsas } = req.body;

    if (!sucursal_id) {
      return res.status(400).json({ error: 'sucursal_id es requerido' });
    }

    const variante = await Variante.findOne({
      where: { id },
      include: [{
        model: Producto,
        as: 'producto',
        where: { sucursal_id }
      }]
    });

    if (!variante) return res.status(404).json({ error: 'Variante no encontrada' });

    await variante.update({
      nombre: nombre !== undefined ? nombre : variante.nombre,
      precio: precio !== undefined ? precio : variante.precio,
      stock: stock !== undefined ? stock : variante.stock,
      max_sabores: max_sabores !== undefined ? max_sabores : variante.max_sabores,
      max_frutas: max_frutas !== undefined ? max_frutas : variante.max_frutas,
      max_toppings_gratis: max_toppings_gratis !== undefined ? max_toppings_gratis : variante.max_toppings_gratis,
      max_toppings_pago: max_toppings_pago !== undefined ? max_toppings_pago : variante.max_toppings_pago,
      max_salsas: max_salsas !== undefined ? max_salsas : variante.max_salsas,
    });

    res.json({ data: variante, mensaje: 'Variante actualizada con éxito' });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Error al actualizar la variante' });
  }
};

const eliminarVariante = async (req, res) => {
  try {
    const { id } = req.params;
    const { sucursal_id } = req.query;

    if (!sucursal_id) {
      return res.status(400).json({ error: 'sucursal_id es requerido' });
    }

    const variante = await Variante.findOne({
      where: { id },
      include: [{
        model: Producto,
        as: 'producto',
        where: { sucursal_id }
      }]
    });

    if (!variante) return res.status(404).json({ error: 'Variante no encontrada' });

    await variante.destroy();
    res.json({ mensaje: 'Variante eliminada con éxito' });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Error al eliminar la variante' });
  }
};

module.exports = { crearVariante, obtenerVariantesPorProducto, actualizarVariante, eliminarVariante };