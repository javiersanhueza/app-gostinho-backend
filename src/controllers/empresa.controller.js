const { Op } = require('sequelize');
const Empresa = require('../models/empresa.model');
const Plan = require('../models/plan.model');

/**
 * @swagger
 * tags:
 *   name: Empresas
 *   description: Gestión de empresas (Solo ADMIN_SISTEMA)
 * 
 * /empresas:
 *   get:
 *     summary: Obtener lista de empresas con filtros
 *     tags: [Empresas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: nombre
 *         schema:
 *           type: string
 *         description: Filtrar empresas por nombre (búsqueda parcial).
 *       - in: query
 *         name: rut
 *         schema:
 *           type: string
 *         description: Filtrar por RUT exacto.
 *       - in: query
 *         name: plan_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por el ID de un plan específico.
 *       - in: query
 *         name: suscripcionActiva
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado de suscripción (true o false).
 *     responses:
 *       200:
 *         description: Lista de empresas filtrada.
 */
const getEmpresas = async (req, res) => {
  try {
    const { nombre, rut, plan_id, suscripcionActiva } = req.query;
    const whereClause = {};

    if (nombre) {
      // Usamos Op.iLike para búsqueda case-insensitive en PostgreSQL
      // o Op.like para MySQL (case-sensitive por defecto, depende de la colación de la DB)
      whereClause.nombre = { [Op.like]: `%${nombre}%` };
    }
    if (rut) {
      whereClause.rut = rut;
    }
    if (plan_id) {
      whereClause.plan_id = plan_id;
    }
    if (suscripcionActiva !== undefined) {
      // Convertimos el string 'true' o 'false' a booleano
      whereClause.suscripcionActiva = (suscripcionActiva === 'true');
    }

    const empresas = await Empresa.findAll({
      where: whereClause,
      include: { model: Plan, as: 'plan' },
      order: [['nombre', 'ASC']]
    });

    res.json({ data: empresas });
  } catch (error) {
    console.error('Error al obtener empresas:', error);
    res.status(500).json({ error: 'Error al obtener empresas' });
  }
};

const getEmpresaById = async (req, res) => {
  try {
    const empresa = await Empresa.findByPk(req.params.id, { include: { model: Plan, as: 'plan' } });
    if (!empresa) return res.status(404).json({ error: 'Empresa no encontrada' });
    res.json(empresa);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la empresa' });
  }
};

const createEmpresa = async (req, res) => {
  try {
    const { nombre, rut, plan_id, fechaVencimiento } = req.body;

    const nuevaEmpresa = await Empresa.create({
      nombre,
      rut,
      plan_id,
      fechaVencimiento
    });

    res.status(201).json(nuevaEmpresa);

  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        error: 'El RUT ingresado ya se encuentra registrado en el sistema.',
        detalle: 'Conflict on field: rut'
      });
    }
    console.error('Error al crear empresa:', error);
    res.status(500).json({
      error: 'Error interno al intentar crear la empresa',
      detalle: error.message
    });
  }
};

const updateEmpresa = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Empresa.update(req.body, { where: { id } });
    if (!updated) return res.status(404).json({ error: 'Empresa no encontrada' });
    const empresaActualizada = await Empresa.findByPk(id);
    res.json(empresaActualizada);
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar la empresa' });
  }
};

const deleteEmpresa = async (req, res) => {
  try {
    const deleted = await Empresa.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'Empresa no encontrada' });
    res.json({ mensaje: 'Empresa eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la empresa' });
  }
};

module.exports = {
  getEmpresas,
  getEmpresaById,
  createEmpresa,
  updateEmpresa,
  deleteEmpresa
};
