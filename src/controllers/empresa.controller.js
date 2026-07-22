const { Op } = require('sequelize');
const Empresa = require('../models/empresa.model');
const Plan = require('../models/plan.model');
const Usuario = require('../models/usuario.model');
const Sucursal = require('../models/sucursal.model');
const Rol = require('../models/rol.model');
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

const getEmpresaById = async (req, res) => {
  try {
    const { id } = req.params;

    const empresaPromise = Empresa.findByPk(id, {
      include: { model: Plan, as: 'plan' }
    });

    const totalSucursalesPromise = Sucursal.count({ where: { empresa_id: id } });
    const totalUsuariosPromise = Usuario.count({ where: { empresa_id: id } });

    // --- Consulta Corregida ---
    const adminEmpresaPromise = Usuario.findOne({
      where: { empresa_id: id },
      include: [{
        model: Rol,
        as: 'roles',
        where: { nombre: ROLES.ADMIN_EMPRESA }
      }],
      attributes: ['id', 'nombre', 'email', 'activo']
    });

    const [empresa, totalSucursales, totalUsuarios, adminEmpresa] = await Promise.all([
        empresaPromise,
        totalSucursalesPromise,
        totalUsuariosPromise,
        adminEmpresaPromise
    ]);

    if (!empresa) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    const response = {
      ...empresa.toJSON(),
      totalSucursales,
      totalUsuarios,
      adminEmpresa: adminEmpresa || null
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
