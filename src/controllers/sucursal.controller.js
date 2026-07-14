const Sucursal = require('../models/sucursal.model');
const Empresa = require('../models/empresa.model');
const ROLES = require('../config/roles');

/**
 * @swagger
 * components:
 *   schemas:
 *     Sucursal:
 *       type: object
 *       required:
 *         - nombre
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: El ID de la sucursal generado automáticamente
 *         nombre:
 *           type: string
 *           description: El nombre de la sucursal
 *         direccion:
 *           type: string
 *           description: La dirección de la sucursal
 *         activo:
 *           type: boolean
 *           description: Estado de la sucursal
 *         empresa_id:
 *           type: string
 *           format: uuid
 *           description: El ID de la empresa a la que pertenece la sucursal
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *
 * tags:
 *   name: Sucursales
 *   description: Gestión de sucursales asociadas a empresas
 */

/**
 * @swagger
 * /sucursales:
 *   get:
 *     summary: Retorna la lista de sucursales de la empresa
 *     tags: [Sucursales]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: La lista de las sucursales
 */
const getSucursales = async (req, res) => {
  try {
    const creador = req.usuario;
    let whereClause = {};

    // Si es un ADMIN_EMPRESA, ve solo sus sucursales
    if (creador.rol === ROLES.ADMIN_EMPRESA) {
       whereClause.empresa_id = creador.empresa_id;
    }

    const sucursales = await Sucursal.findAll({ 
      where: whereClause,
      include: { model: Empresa, as: 'empresa', attributes: ['id', 'nombre'] } 
    });
    res.json({ data: sucursales });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener sucursales' });
  }
};

/**
 * @swagger
 * /sucursales/{id}:
 *   get:
 *     summary: Obtiene una sucursal por ID
 *     tags: [Sucursales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Sucursal encontrada
 *       404:
 *         description: Sucursal no encontrada
 */
const getSucursalById = async (req, res) => {
  try {
    const creador = req.usuario;
    const sucursal = await Sucursal.findByPk(req.params.id, { include: { model: Empresa, as: 'empresa', attributes: ['id', 'nombre'] } });
    
    if (!sucursal) return res.status(404).json({ error: 'Sucursal no encontrada' });

    // Validar permisos
    if (creador.rol === ROLES.ADMIN_EMPRESA && sucursal.empresa_id !== creador.empresa_id) {
       return res.status(403).json({ error: 'No tienes acceso a esta sucursal' });
    }

    res.json(sucursal);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la sucursal' });
  }
};

/**
 * @swagger
 * /sucursales:
 *   post:
 *     summary: Crea una nueva sucursal
 *     tags: [Sucursales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *             properties:
 *               nombre:
 *                 type: string
 *               direccion:
 *                 type: string
 *               activo:
 *                 type: boolean
 *               empresa_id:
 *                 type: string
 *                 format: uuid
 *                 description: Opcional si eres ADMIN_EMPRESA
 *     responses:
 *       201:
 *         description: Sucursal creada
 */
const createSucursal = async (req, res) => {
  try {
    const { nombre, direccion, activo, empresa_id } = req.body;
    const creador = req.usuario;

    let empresa_id_asignar = creador.empresa_id;

    if (creador.rol === ROLES.ADMIN_SISTEMA) {
       if (!empresa_id) return res.status(400).json({ error: 'Como ADMIN_SISTEMA debes indicar a qué empresa_id pertenece la sucursal.'});
       empresa_id_asignar = empresa_id;
    }

    // Verificar si la empresa existe
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

/**
 * @swagger
 * /sucursales/{id}:
 *   put:
 *     summary: Actualiza una sucursal por ID
 *     tags: [Sucursales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               direccion:
 *                 type: string
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Sucursal actualizada
 */
const updateSucursal = async (req, res) => {
  try {
    const { id } = req.params;
    const creador = req.usuario;
    
    const sucursal = await Sucursal.findByPk(id);
    if (!sucursal) return res.status(404).json({ error: 'Sucursal no encontrada' });

    if (creador.rol === ROLES.ADMIN_EMPRESA && sucursal.empresa_id !== creador.empresa_id) {
       return res.status(403).json({ error: 'No tienes permisos para editar esta sucursal' });
    }

    // No permitimos que un ADMIN_EMPRESA cambie la sucursal de empresa
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

/**
 * @swagger
 * /sucursales/{id}:
 *   delete:
 *     summary: Elimina una sucursal por ID
 *     tags: [Sucursales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sucursal eliminada
 */
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