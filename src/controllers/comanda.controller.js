const logger = require('../utils/logger');
const Comanda = require('../models/comanda.model');
const Orden = require('../models/orden.model');
const OrdenDetalle = require('../models/orden_detalle.model');
const Producto = require('../models/producto.model');
const Variante = require('../models/variante.model');
const Topping = require('../models/topping.model');
const sequelize = require('../config/db');
const ROLES = require('../config/roles');

/**
 * @swagger
 * components:
 *   schemas:
 *     Comanda:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         numero_mesa:
 *           type: integer
 *         estado:
 *           type: string
 *           enum: [ABIERTA, CERRADA, PAGADA]
 *         total_acumulado:
 *           type: integer
 *         sucursal_id:
 *           type: string
 *           format: uuid
 * 
 * tags:
 *   name: Comandas
 *   description: Gestión de cuentas de mesas
 */

/**
 * @swagger
 * /comandas:
 *   post:
 *     summary: Abrir una nueva comanda (cuenta) para una mesa
 *     tags: [Comandas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [numero_mesa]
 *             properties:
 *               numero_mesa:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Comanda creada exitosamente
 */
const abrirComanda = async (req, res) => {
  try {
    const { numero_mesa } = req.body;
    const creador = req.usuario;
    const sucursal_id = req.body.sucursal_id || req.query.sucursal_id || creador.sucursal_id;

    if (!sucursal_id) {
      return res.status(400).json({ error: 'Falta enviar el sucursal_id o tu usuario no tiene una asignada.' });
    }

    const nuevaComanda = await Comanda.create({
      numero_mesa,
      empresa_id: creador.empresa_id,
      sucursal_id: sucursal_id,
      estado: 'ABIERTA'
    });

    res.status(201).json({ data: nuevaComanda });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: `La mesa ${req.body.numero_mesa} ya tiene una cuenta abierta.` });
    }
    res.status(500).json({ error: 'Error al abrir la comanda' });
  }
};

/**
 * @swagger
 * /comandas/{id}/add-order:
 *   post:
 *     summary: Añadir un nuevo pedido a una comanda existente
 *     tags: [Comandas]
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
 *             $ref: '#/components/schemas/OrdenInput'
 *     responses:
 *       201:
 *         description: Orden añadida a la comanda
 */
const agregarOrdenAComanda = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id: comanda_id } = req.params;
    const { detalles } = req.body;
    const creador = req.usuario;
    const sucursal_id = req.body.sucursal_id || req.query.sucursal_id || creador.sucursal_id;

    const comanda = await Comanda.findOne({
      where: { id: comanda_id, sucursal_id: sucursal_id, estado: 'ABIERTA' },
      transaction: t
    });

    if (!comanda) {
      await t.rollback();
      return res.status(404).json({ error: 'Comanda no encontrada, no está abierta o no pertenece a tu sucursal.' });
    }

    let totalOrden = 0;
    const detallesProcesados = [];

    for (const item of detalles) {
      if (!item.variante_id || !item.producto_id) {
        await t.rollback();
        return res.status(400).json({ error: `Falta variante_id o producto_id en un item del detalle.` });
      }

      const variante = await Variante.findOne({
        where: { id: item.variante_id, producto_id: item.producto_id },
        include: [{ model: Producto, as: 'producto' }],
        transaction: t
      });

      if (!variante) {
        await t.rollback();
        return res.status(404).json({ error: `Variante no encontrada en la BD (ID: ${item.variante_id})` });
      }

      if (!variante.stock) {
        await t.rollback();
        return res.status(400).json({ error: `La variante (ID: ${item.variante_id}) no tiene stock.` });
      }

      const empresaAUsar = comanda.empresa_id || creador.empresa_id;
      if (!empresaAUsar || variante.producto.empresa_id !== empresaAUsar) {
        await t.rollback();
        return res.status(403).json({ error: `El producto no pertenece a la empresa actual.` });
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
      }

      const subtotal = precioItem * item.cantidad;
      totalOrden += subtotal;

      detallesProcesados.push({
        cantidad: item.cantidad,
        precio_unitario: precioItem,
        subtotal: subtotal,
        producto_id: variante.producto.id,
        opciones_elegidas: opciones_elegidas || null,
        nombre_producto_historico: `${variante.producto.nombre} (${variante.nombre})`
      });
    }

    const nuevaOrden = await Orden.create({
      empresa_id: creador.empresa_id,
      sucursal_id: sucursal_id,
      comanda_id: comanda.id, // VINCULAMOS LA ORDEN
      total: totalOrden,
      estado: 'EN_PREPARACION' // Las órdenes de mesa no se pagan al instante
    }, { transaction: t });

    const detallesAInsertar = detallesProcesados.map(d => ({ ...d, orden_id: nuevaOrden.id }));
    await OrdenDetalle.bulkCreate(detallesAInsertar, { transaction: t });

    // Actualizamos el total de la comanda
    await comanda.increment('total_acumulado', { by: totalOrden, transaction: t });

    await t.commit();
    res.status(201).json({ mensaje: 'Orden agregada a la comanda', data: nuevaOrden });

  } catch (error) {
    await t.rollback();
    logger.error(error);
    res.status(500).json({ error: 'Error al agregar la orden' });
  }
};

/**
 * @swagger
 * /comandas/{id}/close:
 *   put:
 *     summary: Cerrar y pagar una comanda
 *     tags: [Comandas]
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
 *               metodo_pago:
 *                 type: string
 *                 enum: [EFECTIVO, TARJETA, TRANSFERENCIA]
 *     responses:
 *       200:
 *         description: Comanda cerrada y pagada
 */
const cerrarComanda = async (req, res) => {
    try {
        const { id } = req.params;
        const { metodo_pago } = req.body;
        const creador = req.usuario;
        const sucursal_id = req.body.sucursal_id || req.query.sucursal_id || creador.sucursal_id;

        const comanda = await Comanda.findOne({
            where: { id, sucursal_id: sucursal_id, estado: 'ABIERTA' }
        });

        if (!comanda) {
            return res.status(404).json({ error: 'Comanda no encontrada o ya está cerrada.' });
        }

        await comanda.update({ estado: 'PAGADA' });
        
        // Opcional: Podríamos querer actualizar el método de pago en todas las órdenes asociadas
        await Orden.update(
            { metodo_pago: metodo_pago || 'EFECTIVO', estado: 'PAGADO' },
            { where: { comanda_id: id } }
        );

        res.json({ mensaje: 'Comanda cerrada y pagada exitosamente', total: comanda.total_acumulado });
    } catch (error) {
        logger.error(error);
        res.status(500).json({ error: 'Error al cerrar la comanda' });
    }
};

/**
 * @swagger
 * /comandas:
 *   get:
 *     summary: Obtener todas las comandas abiertas de la sucursal
 *     tags: [Comandas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de comandas abiertas
 */
const obtenerComandasAbiertas = async (req, res) => {
    try {
        const creador = req.usuario;
        const sucursal_id = req.query.sucursal_id || req.body.sucursal_id || creador.sucursal_id;
        
        if (!sucursal_id) {
            return res.status(400).json({ error: 'Falta especificar la sucursal_id.' });
        }

        const comandas = await Comanda.findAll({
            where: { sucursal_id: sucursal_id, estado: 'ABIERTA' },
            include: [{
                model: Orden,
                as: 'ordenes',
                attributes: ['id', 'total', 'estado'],
                include: [{
                    model: OrdenDetalle,
                    as: 'detalles',
                    attributes: ['nombre_producto_historico', 'cantidad']
                }]
            }],
            order: [['numero_mesa', 'ASC']]
        });
        res.json({ data: comandas });
    } catch (error) {
        logger.error(error);
        res.status(500).json({ error: 'Error al obtener las comandas' });
    }
};


module.exports = { abrirComanda, agregarOrdenAComanda, cerrarComanda, obtenerComandasAbiertas };