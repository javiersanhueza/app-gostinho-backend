const logger = require('../utils/logger');
const Orden = require('../models/orden.model');
const OrdenDetalle = require('../models/orden_detalle.model');
const Producto = require('../models/producto.model');
const Variante = require('../models/variante.model');
const Cliente = require('../models/cliente.model');
const GrupoOpciones = require('../models/grupo_opciones.model');
const Sabor = require('../models/sabor.model');
const Fruta = require('../models/fruta.model');
const Topping = require('../models/topping.model');
const sequelize = require('../config/db');
const ROLES = require('../config/roles');

// ... (Swagger docs se mantienen igual, pero el input de OrdenDetalle ahora es más complejo)
// Se actualiza la documentación para reflejar el nuevo formato de opciones_elegidas
/**
 * @swagger
 * components:
 *   schemas:
 *     OpcionesElegidasInput:
 *       type: object
 *       properties:
 *         sabores:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *         frutas:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *         toppings:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 * 
 *     OrdenDetalleInput:
 *       type: object
 *       required:
 *         - producto_id
 *         - variante_id
 *         - cantidad
 *       properties:
 *         producto_id:
 *           type: string
 *           format: uuid
 *         variante_id:
 *           type: string
 *           format: uuid
 *         cantidad:
 *           type: integer
 *         opciones_elegidas:
 *           $ref: '#/components/schemas/OpcionesElegidasInput'
 */
const crearOrden = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { cliente_id, metodo_pago, tipo_entrega, detalles } = req.body;
    const creador = req.usuario;

    const sucursal_id = req.body.sucursal_id || creador.sucursal_id;

    if (!sucursal_id) {
        await t.rollback();
        return res.status(400).json({ error: 'Tu usuario no tiene una sucursal asignada o no se envió en el body.' });
    }
    if (!detalles || detalles.length === 0) {
      await t.rollback();
      return res.status(400).json({ error: 'La orden debe tener al menos un producto.' });
    }

    let totalOrden = 0;
    const detallesProcesados = [];

    for (const item of detalles) {
      const variante = await Variante.findOne({
        where: { id: item.variante_id, producto_id: item.producto_id, stock: true },
        include: [{ model: Producto, as: 'producto', where: { sucursal_id: sucursal_id } }],
        transaction: t
      });

      if (!variante) {
        await t.rollback();
        return res.status(404).json({ error: `Producto o Variante no encontrada/sin stock (ID: ${item.producto_id})` });
      }

      let precioItem = variante.precio;
      const { opciones_elegidas } = item;
      
      if (opciones_elegidas && Array.isArray(opciones_elegidas)) {
        for (const configItem of opciones_elegidas) {
          const { config } = configItem;
          if (config && config.toppings_pago && config.toppings_pago.length > 0) {
            const toppingIds = config.toppings_pago.map(t => t.id);
            const toppingsDB = await Topping.findAll({ where: { id: toppingIds }, transaction: t });
            toppingsDB.forEach(tp => {
              precioItem += tp.precio_extra;
            });
          }
        }
      } else if (opciones_elegidas) {
        // Fallback for old structure
        const { sabores, frutas, toppings } = opciones_elegidas;
        if (toppings) {
            const toppingsDB = await Topping.findAll({ where: { id: toppings }, transaction: t });
            const toppingsPago = toppingsDB.filter(tp => tp.precio_extra > 0);
            toppingsPago.forEach(tp => {
                precioItem += tp.precio_extra;
            });
        }
      }

      const subtotal = precioItem * item.cantidad;
      totalOrden += subtotal;

      detallesProcesados.push({
        cantidad: item.cantidad,
        precio_unitario: precioItem,
        subtotal: subtotal,
        opciones_elegidas: opciones_elegidas || null,
        producto_id: variante.producto_id,
        nombre_producto_historico: `${variante.producto.nombre} (${variante.nombre})`
      });
    }

    // Calcular folio diario
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const { Op } = require('sequelize');

    const ultimaOrden = await Orden.findOne({
      where: {
        sucursal_id: sucursal_id,
        created_at: {
          [Op.between]: [startOfDay, endOfDay]
        }
      },
      order: [['folio_diario', 'DESC']],
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    const nextFolioDiario = ultimaOrden && ultimaOrden.folio_diario ? ultimaOrden.folio_diario + 1 : 1;

    const nuevaOrden = await Orden.create({
      empresa_id: creador.empresa_id,
      sucursal_id: sucursal_id,
      cliente_id: cliente_id || null,
      total: totalOrden,
      metodo_pago,
      tipo_entrega,
      estado: 'PENDIENTE',
      folio_diario: nextFolioDiario
    }, { transaction: t });

    const detallesAInsertar = detallesProcesados.map(d => ({ ...d, orden_id: nuevaOrden.id }));
    await OrdenDetalle.bulkCreate(detallesAInsertar, { transaction: t });

    if (cliente_id) {
       const puntosGanados = Math.floor(totalOrden / 1000);
       if (puntosGanados > 0) {
          const cliente = await Cliente.findByPk(cliente_id, { transaction: t });
          if (cliente) await cliente.increment('puntos_lealtad', { by: puntosGanados, transaction: t });
       }
    }

    await t.commit();
    res.status(201).json({
      mensaje: 'Orden creada exitosamente',
      data: { id: nuevaOrden.id, folio_diario: nuevaOrden.folio_diario, folio: nuevaOrden.folio, total: nuevaOrden.total, codigo_qr_reclamo: nuevaOrden.codigo_reclamo }
    });

  } catch (error) {
    await t.rollback();
    logger.error('Error al crear la orden:', error);
    res.status(500).json({ error: 'Error interno al procesar la orden' });
  }
};

// ... (el resto de los métodos como obtenerOrdenes y reclamarPuntos se mantienen igual)
const obtenerOrdenes = async (req, res) => {
    try {
        const { Op } = require('sequelize');
        const { sucursal_id, empresa_id, rol } = req.usuario;
        let whereClause = {};
        if (rol === ROLES.ADMIN_EMPRESA || rol === ROLES.ADMIN_SISTEMA) {
            whereClause.empresa_id = empresa_id;
            if (req.query.sucursal_id) {
                whereClause.sucursal_id = req.query.sucursal_id;
            }
        } else {
             whereClause.sucursal_id = sucursal_id;
        }
        
        // Filtros por fecha
        if (req.query.fecha_inicio && req.query.fecha_fin) {
           const [y, m, d] = req.query.fecha_inicio.split('-');
           const fechaInicio = new Date(y, m - 1, d, 0, 0, 0, 0);
           
           const [y2, m2, d2] = req.query.fecha_fin.split('-');
           const fechaFin = new Date(y2, m2 - 1, d2, 23, 59, 59, 999);
           
           whereClause.created_at = {
              [Op.between]: [fechaInicio, fechaFin]
           };
        }
        const ordenes = await Orden.findAll({
            where: whereClause,
            include: [
                { model: OrdenDetalle, as: 'detalles' },
                { model: Cliente, as: 'cliente' }
            ],
            order: [['created_at', 'DESC']],
            limit: 50 
        });
        res.json({ data: ordenes });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las órdenes' });
    }
};

const reclamarPuntos = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { codigo_reclamo } = req.body;
    const cliente_id = req.usuario.id; 
    if (!codigo_reclamo) {
        await t.rollback();
        return res.status(400).json({ error: 'Debes enviar el código de reclamo del ticket.' });
    }
    const orden = await Orden.findOne({ where: { codigo_reclamo }, transaction: t });
    if (!orden) {
        await t.rollback();
        return res.status(404).json({ error: 'El código de la boleta no es válido.' });
    }
    if (orden.cliente_id !== null) {
        await t.rollback();
        return res.status(400).json({ error: 'Esta boleta ya fue reclamada.' });
    }
    const puntosGanados = Math.floor(orden.total / 1000);
    await orden.update({ cliente_id }, { transaction: t });
    if (puntosGanados > 0) {
        const cliente = await Cliente.findByPk(cliente_id, { transaction: t });
        if (cliente) {
            await cliente.increment('puntos_lealtad', { by: puntosGanados, transaction: t });
        } else {
            await t.rollback();
            return res.status(404).json({ error: 'No se encontró tu perfil de cliente.' });
        }
    }
    await t.commit();
    res.json({ mensaje: '¡Puntos reclamados!', puntosGanados });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ error: 'Error interno al procesar el reclamo.' });
  }
};

module.exports = { crearOrden, obtenerOrdenes, reclamarPuntos };