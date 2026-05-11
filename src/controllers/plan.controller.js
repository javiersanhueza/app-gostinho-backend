const Plan = require('../models/plan.model');

/**
 * @swagger
 * tags:
 *   name: Planes
 *   description: Gestión de planes de suscripción (Solo ADMIN_SISTEMA)
 */

const obtenerPlanes = async (req, res) => {
  try {
    const planes = await Plan.findAll({
      order: [['precioMensual', 'ASC']]
    });
    res.json({ data: planes });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los planes' });
  }
};

const crearPlan = async (req, res) => {
  try {
    const { nombre, descripcion, precioMensual, maxSucursales, maxUsuarios } = req.body;

    const nuevoPlan = await Plan.create({
      nombre,
      descripcion,
      precioMensual,
      maxSucursales: maxSucursales || 1,
      maxUsuarios: maxUsuarios || 3,
      activo: true
    });

    res.status(201).json({ mensaje: 'Plan creado con éxito', data: nuevoPlan });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Ya existe un plan con ese nombre' });
    }
    res.status(500).json({ error: 'Error al crear el plan' });
  }
};

const editarPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Plan.update(req.body, { where: { id } });

    if (!updated) return res.status(404).json({ error: 'Plan no encontrado' });

    const planActualizado = await Plan.findByPk(id);
    res.json({ mensaje: 'Plan actualizado', data: planActualizado });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el plan' });
  }
};

const toggleEstadoPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await Plan.findByPk(id);

    if (!plan) return res.status(404).json({ error: 'Plan no encontrado' });

    plan.activo = !plan.activo;
    await plan.save();

    res.json({
      mensaje: `El plan ${plan.nombre} ahora está ${plan.activo ? 'activo' : 'inactivo'}`,
      data: plan
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al cambiar el estado del plan' });
  }
};

module.exports = { obtenerPlanes, crearPlan, editarPlan, toggleEstadoPlan };
