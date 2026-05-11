const Empresa = require('../models/empresa.model');
const Plan = require('../models/plan.model');

/**
 * @swagger
 * tags:
 *   name: Empresas
 *   description: Gestión de empresas (Solo ADMIN_SISTEMA)
 */

const getEmpresas = async (req, res) => {
  try {
    const empresas = await Empresa.findAll({ include: { model: Plan, as: 'plan' } });
    res.json({ data: empresas });
  } catch (error) {
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

    // Intentamos crear la empresa
    const nuevaEmpresa = await Empresa.create({
      nombre,
      rut,
      plan_id,
      fechaVencimiento
    });

    res.status(201).json(nuevaEmpresa);

  } catch (error) {
    // 1. Validar si el error es por duplicidad (RUT ya existe)
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        error: 'El RUT ingresado ya se encuentra registrado en el sistema.',
        detalle: 'Conflict on field: rut'
      });
    }

    // 2. Otros errores (ej: problemas de conexión o validación de UUID)
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
