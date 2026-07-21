const { Op } = require('sequelize');
const Sucursal = require('../models/sucursal.model');
const Empresa = require('../models/empresa.model');
const ROLES = require('../config/roles');

/**
 * @swagger
 * /sucursales:
 *   get:
 *     summary: Obtener lista paginada de sucursales con filtros
 *     tags: [Sucursales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: nombre
 *         schema:
 *           type: string
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: empresa_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: (Solo ADMIN_SISTEMA) Filtrar por empresa.
 *     responses:
 *       200:
 *         description: Lista paginada de sucursales.
 */
const getSucursales = async (req, res) => {
  try {
    const { page = 1, limit = 10, nombre, activo, empresa_id } = req.query;
    const creador = req.usuario;
    const offset = (page - 1) * limit;

    let whereClause = {};

    // Filtros de búsqueda
    if (nombre) whereClause.nombre = { [Op.like]: `%${nombre}%` };
    if (activo !== undefined) whereClause.activo = (activo === 'true');

    // Lógica de permisos y filtros de seguridad
    if (creador.rol === ROLES.ADMIN_EMPRESA) {
      whereClause.empresa_id = creador.empresa_id;
    } else if (creador.rol === ROLES.ADMIN_SISTEMA && empresa_id) {
      whereClause.empresa_id = empresa_id;
    }

    const { count, rows } = await Sucursal.findAndCountAll({
      where: whereClause,
      include: { model: Empresa, as: 'empresa', attributes: ['id', 'nombre'] },
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
    res.status(500).json({ error: 'Error al obtener sucursales' });
  }
};

// ... (el resto de los métodos se mantienen igual)
const getSucursalById = async (req, res) => {
  try {
    const creador = req.usuario;
    const sucursal = await Sucursal.findByPk(req.params.id, { include: { model: Empresa, as: 'empresa', attributes: ['id', 'nombre'] } });
    
    if (!sucursal) return res.status(404).json({ error: 'Sucursal no encontrada' });

    if (creador.rol === ROLES.ADMIN_EMPRESA && sucursal.empresa_id !== creador.empresa_id) {
       return res.status(403).json({ error: 'No tienes acceso a esta sucursal' });
    }

    res.json(sucursal);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la sucursal' });
  }
};

const createSucursal = async (req, res) => {
  try {
    const { nombre, direccion, activo, empresa_id } = req.body;
    const creador = req.usuario;

    let empresa_id_asignar = creador.empresa_id;

    if (creador.rol === ROLES.ADMIN_SISTEMA) {
       if (!empresa_id) return res.status(400).json({ error: 'Como ADMIN_SISTEMA debes indicar a qué empresa_id pertenece la sucursal.'});
       empresa_id_asignar = empresa_id;
    }

    const empresa = await Empresa.findByPk(empresa_id_asignar);
    if (!empresa) {
        return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    const nuevaSucursal = await Sucursal.create({
      nombre,
      direccion,
      activo: activo !== undefined ? activo : true,
      empresa_id: empresa_id_asignar
    });

    res.status(201).json(nuevaSucursal);
  } catch (error) {
    console.error('Error al crear sucursal:', error);
    res.status(500).json({ error: 'Error interno al intentar crear la sucursal' });
  }
};

const updateSucursal = async (req, res) => {
  try {
    const { id } = req.params;
    const creador = req.usuario;
    
    const sucursal = await Sucursal.findByPk(id);
    if (!sucursal) return res.status(404).json({ error: 'Sucursal no encontrada' });

    if (creador.rol === ROLES.ADMIN_EMPRESA && sucursal.empresa_id !== creador.empresa_id) {
       return res.status(403).json({ error: 'No tienes permisos para editar esta sucursal' });
    }

    const dataActualizar = { ...req.body };
    if (creador.rol === ROLES.ADMIN_EMPRESA) {
       delete dataActualizar.empresa_id; 
    }

    await Sucursal.update(dataActualizar, { where: { id } });
    const sucursalActualizada = await Sucursal.findByPk(id);
    res.json(sucursalActualizada);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar la sucursal' });
  }
};

const deleteSucursal = async (req, res) => {
  try {
    const { id } = req.params;
    const creador = req.usuario;

    const sucursal = await Sucursal.findByPk(id);
    if (!sucursal) return res.status(404).json({ error: 'Sucursal no encontrada' });

    if (creador.rol === ROLES.ADMIN_EMPRESA && sucursal.empresa_id !== creador.empresa_id) {
       return res.status(403).json({ error: 'No tienes permisos para eliminar esta sucursal' });
    }

    await Sucursal.destroy({ where: { id } });
    res.json({ mensaje: 'Sucursal eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la sucursal' });
  }
};

module.exports = {
  getSucursales,
  getSucursalById,
  createSucursal,
  updateSucursal,
  deleteSucursal
};
