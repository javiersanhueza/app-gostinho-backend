const { Op } = require('sequelize');
const Empresa = require('../models/empresa.model');
const Plan = require('../models/plan.model');

/**
 * @swagger
 * /empresas:
 *   get:
 *     summary: Obtener lista paginada de empresas con filtros
 *     tags: [Empresas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de la página a obtener.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Cantidad de resultados por página.
 *       - in: query
 *         name: nombre
 *         schema:
 *           type: string
 *         description: Filtrar por nombre.
 *       - in: query
 *         name: rut
 *         schema:
 *           type: string
 *         description: Filtrar por RUT.
 *       - in: query
 *         name: plan_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por ID de plan.
 *       - in: query
 *         name: suscripcionActiva
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado de suscripción.
 *     responses:
 *       200:
 *         description: Lista paginada de empresas.
 */
const getEmpresas = async (req, res) => {
  try {
    const { page = 1, limit = 10, nombre, rut, plan_id, suscripcionActiva } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (nombre) whereClause.nombre = { [Op.like]: `%${nombre}%` };
    if (rut) whereClause.rut = rut;
    if (plan_id) whereClause.plan_id = plan_id;
    if (suscripcionActiva !== undefined) whereClause.suscripcionActiva = (suscripcionActiva === 'true');

    const { count, rows } = await Empresa.findAndCountAll({
      where: whereClause,
      include: { model: Plan, as: 'plan' },
      order: [['nombre', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: rows
    });
  } catch (error) {
    console.error('Error al obtener empresas:', error);
    res.status(500).json({ error: 'Error al obtener empresas' });
  }
};

// ... (el resto de los métodos se mantienen igual)

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
    const nuevaEmpresa = await Empresa.create({ nombre, rut, plan_id, fechaVencimiento });
    res.status(201).json(nuevaEmpresa);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'El RUT ingresado ya se encuentra registrado.' });
    }
    console.error('Error al crear empresa:', error);
    res.status(500).json({ error: 'Error interno al crear la empresa' });
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
