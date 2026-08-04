const Descuento = require('../models/descuento.model');
const Producto = require('../models/producto.model');
const Sucursal = require('../models/sucursal.model');
const { Op } = require('sequelize');

const crearDescuento = async (req, res) => {
  try {
    const { 
      nombre, porcentaje, fecha_inicio, fecha_fin, 
      aplica_a_todo, aplica_todas_sucursales, 
      empresa_id, sucursal_id, activo, productos_ids 
    } = req.body;

    if (!empresa_id) {
      return res.status(400).json({ error: 'empresa_id es requerido' });
    }

    if (!aplica_todas_sucursales && !sucursal_id) {
      return res.status(400).json({ error: 'sucursal_id es requerido si no aplica a todas las sucursales' });
    }

    const nuevoDescuento = await Descuento.create({
      nombre,
      porcentaje,
      fecha_inicio,
      fecha_fin,
      aplica_a_todo: aplica_a_todo || false,
      aplica_todas_sucursales: aplica_todas_sucursales || false,
      activo: activo !== undefined ? activo : true,
      empresa_id,
      sucursal_id: aplica_todas_sucursales ? null : sucursal_id
    });

    if (!aplica_a_todo && productos_ids && productos_ids.length > 0) {
      await nuevoDescuento.setProductos(productos_ids);
    }

    res.status(201).json({ data: nuevoDescuento, mensaje: 'Descuento creado con éxito' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el descuento' });
  }
};

const obtenerDescuentos = async (req, res) => {
  try {
    const { empresa_id, sucursal_id, search, limit, offset } = req.query;

    if (!empresa_id) {
      return res.status(400).json({ error: 'empresa_id es requerido' });
    }

    const where = { empresa_id };

    if (sucursal_id) {
      where[Op.or] = [
        { sucursal_id },
        { aplica_todas_sucursales: true }
      ];
    }

    if (search) {
      where.nombre = {
        [Op.iLike]: `%${search}%`
      };
    }

    const opciones = {
      where,
      include: [
        { model: Producto, as: 'productos', attributes: ['id', 'nombre'], through: { attributes: [] } },
        { model: Sucursal, as: 'sucursal', attributes: ['id', 'nombre'] }
      ],
      order: [['created_at', 'DESC']]
    };

    if (limit) opciones.limit = parseInt(limit);
    if (offset) opciones.offset = parseInt(offset);

    const { count, rows } = await Descuento.findAndCountAll(opciones);

    res.json({
      data: rows,
      total: count,
      limit: limit ? parseInt(limit) : null,
      offset: offset ? parseInt(offset) : null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los descuentos' });
  }
};

const actualizarDescuento = async (req, res) => {
  try {
    const { id } = req.params;
    const { empresa_id } = req.query;
    const { 
      nombre, porcentaje, fecha_inicio, fecha_fin, 
      aplica_a_todo, aplica_todas_sucursales, activo, 
      productos_ids, sucursal_id
    } = req.body;

    if (!empresa_id) {
      return res.status(400).json({ error: 'empresa_id es requerido' });
    }

    const descuento = await Descuento.findOne({ where: { id, empresa_id } });
    if (!descuento) return res.status(404).json({ error: 'Descuento no encontrado' });

    await descuento.update({
      nombre: nombre !== undefined ? nombre : descuento.nombre,
      porcentaje: porcentaje !== undefined ? porcentaje : descuento.porcentaje,
      fecha_inicio: fecha_inicio !== undefined ? fecha_inicio : descuento.fecha_inicio,
      fecha_fin: fecha_fin !== undefined ? fecha_fin : descuento.fecha_fin,
      aplica_a_todo: aplica_a_todo !== undefined ? aplica_a_todo : descuento.aplica_a_todo,
      aplica_todas_sucursales: aplica_todas_sucursales !== undefined ? aplica_todas_sucursales : descuento.aplica_todas_sucursales,
      activo: activo !== undefined ? activo : descuento.activo,
      sucursal_id: aplica_todas_sucursales ? null : (sucursal_id !== undefined ? sucursal_id : descuento.sucursal_id)
    });

    if (!descuento.aplica_a_todo && productos_ids !== undefined) {
      await descuento.setProductos(productos_ids);
    } else if (descuento.aplica_a_todo) {
      await descuento.setProductos([]);
    }

    res.json({ data: descuento, mensaje: 'Descuento actualizado con éxito' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el descuento' });
  }
};

const eliminarDescuento = async (req, res) => {
  try {
    const { id } = req.params;
    const { empresa_id } = req.query;

    if (!empresa_id) {
      return res.status(400).json({ error: 'empresa_id es requerido' });
    }

    const descuento = await Descuento.findOne({ where: { id, empresa_id } });
    if (!descuento) return res.status(404).json({ error: 'Descuento no encontrado' });

    await descuento.destroy();
    res.json({ mensaje: 'Descuento eliminado con éxito' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el descuento' });
  }
};

module.exports = { crearDescuento, obtenerDescuentos, actualizarDescuento, eliminarDescuento };
