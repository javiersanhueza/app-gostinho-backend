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
const Comanda = require('../models/comanda.model');

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
    const { cliente_id, telefono_cliente, metodo_pago, tipo_entrega, detalles, total_personalizado } = req.body;
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

    let final_cliente_id = cliente_id || null;

    if (telefono_cliente && !final_cliente_id) {
      const cliente = await Cliente.findOne({ where: { telefono: telefono_cliente }, transaction: t });
      if (cliente) {
        final_cliente_id = cliente.id;
      } else {
        await t.rollback();
        return res.status(404).json({ error: 'Cliente no encontrado con ese teléfono. Debe registrarse primero.' });
      }
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

    // Calcular folio diario con raw query (a prueba de fallos)
    const [folioResult] = await sequelize.query(
      `SELECT COALESCE(MAX(folio_diario), 0) as max_folio 
       FROM ordenes 
       WHERE sucursal_id = :sucursal_id 
       AND created_at >= CURRENT_DATE 
       AND created_at < CURRENT_DATE + INTERVAL '1 day'`,
      { 
        replacements: { sucursal_id }, 
        type: sequelize.QueryTypes.SELECT,
        transaction: t,
        lock: t.LOCK.UPDATE
      }
    );

    const nextFolioDiario = (folioResult?.max_folio || 0) + 1;

    const isDeliveryApp = ['UBER_EATS', 'RAPPI', 'PEDIDOS_YA'].includes(metodo_pago);
    const finalTotalOrden = (isDeliveryApp && total_personalizado !== undefined) 
      ? Number(total_personalizado) 
      : totalOrden;

    const nuevaOrden = await Orden.create({
      empresa_id: creador.empresa_id,
      sucursal_id: sucursal_id,
      cliente_id: final_cliente_id,
      total: finalTotalOrden,
      metodo_pago,
      tipo_entrega,
      estado: 'PAGADO',
      folio_diario: nextFolioDiario
    }, { transaction: t });

    const detallesAInsertar = detallesProcesados.map(d => ({ ...d, orden_id: nuevaOrden.id }));
    await OrdenDetalle.bulkCreate(detallesAInsertar, { transaction: t });

    if (final_cliente_id) {
       const FidelidadConfig = require('../models/fidelidad_config.model');
       const BilleteraFidelidad = require('../models/billetera_fidelidad.model');
       
       const config = await FidelidadConfig.findOne({ where: { empresa_id: creador.empresa_id }, transaction: t });
       if (config) {
           let [billetera] = await BilleteraFidelidad.findOrCreate({
               where: { cliente_id: final_cliente_id, empresa_id: creador.empresa_id },
               defaults: { puntos: 0, sellos: 0 },
               transaction: t
           });
           
           if (['PUNTOS', 'AMBOS'].includes(config.tipo_programa)) {
               if (finalTotalOrden >= config.puntos_monto_minimo) {
                   const puntosGanados = Math.floor(finalTotalOrden * (config.puntos_porcentaje / 100));
                   billetera.puntos += puntosGanados;
               }
           }
           
           if (['SELLOS', 'AMBOS'].includes(config.tipo_programa)) {
               if (finalTotalOrden >= config.sellos_monto_minimo) {
                   billetera.sellos += 1;
               }
           }
           await billetera.save({ transaction: t });
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
        const { sucursal_id, empresa_id, roles } = req.usuario;
        let whereClause = {};
        
        const esAdmin = roles && (roles.includes(ROLES.ADMIN_EMPRESA) || roles.includes(ROLES.ADMIN_SISTEMA));
        
        if (esAdmin) {
            whereClause.empresa_id = empresa_id;
            if (req.query.sucursal_id) {
                whereClause.sucursal_id = req.query.sucursal_id;
            }
        } else {
             whereClause.sucursal_id = sucursal_id;
        }
        
        // Filtros por fecha (usa la timezone de la sesión PostgreSQL: America/Santiago)
        const { literal } = require('sequelize');
        if (req.query.fecha_inicio && req.query.fecha_fin) {
           whereClause.created_at = {
              [Op.gte]: literal(`'${req.query.fecha_inicio}'::date`),
              [Op.lt]: literal(`('${req.query.fecha_fin}'::date + INTERVAL '1 day')`)
           };
        }
        const ordenes = await Orden.findAll({
            where: whereClause,
            include: [
                { model: OrdenDetalle, as: 'detalles' },
                { model: Cliente, as: 'cliente' },
                { model: Comanda, as: 'comanda', attributes: ['numero_mesa'] }
            ],
            order: [['created_at', 'DESC']],
            limit: 50 
        });
        res.json({ data: ordenes });
    } catch (error) {
        logger.error('Error al obtener las órdenes:', error);
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
    const FidelidadConfig = require('../models/fidelidad_config.model');
    const BilleteraFidelidad = require('../models/billetera_fidelidad.model');
    
    await orden.update({ cliente_id }, { transaction: t });
    
    const config = await FidelidadConfig.findOne({ where: { empresa_id: orden.empresa_id }, transaction: t });
    if (config) {
        let [billetera] = await BilleteraFidelidad.findOrCreate({
            where: { cliente_id, empresa_id: orden.empresa_id },
            defaults: { puntos: 0, sellos: 0 },
            transaction: t
        });
        
        let puntosGanados = 0;
        let sellosGanados = 0;

        if (['PUNTOS', 'AMBOS'].includes(config.tipo_programa)) {
            if (orden.total >= config.puntos_monto_minimo) {
                puntosGanados = Math.floor(orden.total * (config.puntos_porcentaje / 100));
                billetera.puntos += puntosGanados;
            }
        }
        
        if (['SELLOS', 'AMBOS'].includes(config.tipo_programa)) {
            if (orden.total >= config.sellos_monto_minimo) {
                sellosGanados = 1;
                billetera.sellos += sellosGanados;
            }
        }
        await billetera.save({ transaction: t });
        
        await t.commit();
        res.json({ mensaje: `Boleta reclamada. Ganaste ${puntosGanados} puntos y ${sellosGanados} sellos.`, puntosGanados, sellosGanados });
        return;
    }

    await t.commit();
    res.json({ mensaje: 'Boleta reclamada correctamente.', puntosGanados: 0, sellosGanados: 0 });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ error: 'Error interno al procesar el reclamo.' });
  }
};

const eliminarOrden = async (req, res) => {
  try {
    const { id } = req.params;
    const { empresa_id, roles } = req.usuario;

    const orden = await Orden.findByPk(id);
    if (!orden) {
      return res.status(404).json({ error: 'Orden no encontrada.' });
    }

    // Solo admins de la empresa dueña pueden eliminar
    const esAdmin = roles && (roles.includes(ROLES.ADMIN_EMPRESA) || roles.includes(ROLES.ADMIN_SISTEMA));
    if (!esAdmin || orden.empresa_id !== empresa_id) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta orden.' });
    }

    // Los detalles se eliminan en cascada gracias a onDelete: 'CASCADE'
    await orden.destroy();
    res.json({ mensaje: 'Orden eliminada correctamente.' });
  } catch (error) {
    logger.error('Error al eliminar la orden:', error);
    res.status(500).json({ error: 'Error al eliminar la orden.' });
  }
};

module.exports = { crearOrden, obtenerOrdenes, reclamarPuntos, eliminarOrden };