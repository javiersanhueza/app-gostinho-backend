const { Op } = require('sequelize');
const Empresa = require('../models/empresa.model');
const Plan = require('../models/plan.model');
const Usuario = require('../models/usuario.model');
const Sucursal = require('../models/sucursal.model');
const ROLES = require('../config/roles');

// ... (getEmpresas se mantiene igual)
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

/**
 * @swagger
 * /empresas/{id}:
 *   get:
 *     summary: Obtener el detalle completo de una empresa
 *     tags: [Empresas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Detalle de la empresa con contadores y administrador.
 *       404:
 *         description: Empresa no encontrada.
 */
const getEmpresaById = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Obtener los datos de la empresa y su plan
    const empresa = await Empresa.findByPk(id, {
      include: { model: Plan, as: 'plan' }
    });

    if (!empresa) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    // 2. Contar sucursales y usuarios
    const totalSucursales = await Sucursal.count({ where: { empresa_id: id } });
    const totalUsuarios = await Usuario.count({ where: { empresa_id: id } });

    // 3. Encontrar al usuario administrador de esa empresa
    const adminEmpresa = await Usuario.findOne({
      where: {
        empresa_id: id,
        rol: ROLES.ADMIN_EMPRESA
      },
      attributes: ['id', 'nombre', 'email', 'activo']
    });

    // 4. Ensamblar la respuesta
    const response = {
      ...empresa.toJSON(),
      totalSucursales,
      totalUsuarios,
      adminEmpresa: adminEmpresa || null // Devolver null si no se encuentra
    };

    res.json(response);
  } catch (error) {
    console.error('Error al obtener la empresa:', error);
    res.status(500).json({ error: 'Error al obtener la empresa' });
  }
};

// ... (el resto de los métodos se mantienen igual)
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
