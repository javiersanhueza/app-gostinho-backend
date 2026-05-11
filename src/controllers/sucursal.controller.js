const Sucursal = require('../models/sucursal.model');
const Empresa = require('../models/empresa.model');

/**
 * @swagger
 * components:
 *   schemas:
 *     Sucursal:
 *       type: object
 *       required:
 *         - nombre
 *         - empresa_id
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
 *           description: Fecha de creación
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización
 *
 * tags:
 *   name: Sucursales
 *   description: Gestión de sucursales asociadas a empresas
 */

/**
 * @swagger
 * /sucursales:
 *   get:
 *     summary: Retorna la lista de todas las sucursales
 *     tags: [Sucursales]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: La lista de las sucursales
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Sucursal'
 */
const getSucursales = async (req, res) => {
  try {
    const sucursales = await Sucursal.findAll({ include: { model: Empresa, as: 'empresa' } });
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
 *         description: El ID de la sucursal
 *     responses:
 *       200:
 *         description: La descripción de la sucursal por ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sucursal'
 *       404:
 *         description: La sucursal no fue encontrada
 */
const getSucursalById = async (req, res) => {
  try {
    const sucursal = await Sucursal.findByPk(req.params.id, { include: { model: Empresa, as: 'empresa' } });
    if (!sucursal) return res.status(404).json({ error: 'Sucursal no encontrada' });
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
 *               - empresa_id
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
 *     responses:
 *       201:
 *         description: La sucursal fue creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sucursal'
 *       500:
 *         description: Error en el servidor
 */
const createSucursal = async (req, res) => {
  try {
    const { nombre, direccion, activo, empresa_id } = req.body;
    
    // Verificar si la empresa existe
    const empresa = await Empresa.findByPk(empresa_id);
    if (!empresa) {
        return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    const nuevaSucursal = await Sucursal.create({
      nombre,
      direccion,
      activo: activo !== undefined ? activo : true,
      empresa_id
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
 *         schema:
 *           type: string
 *         required: true
 *         description: El ID de la sucursal
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
 *               empresa_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: La sucursal fue actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sucursal'
 *       404:
 *         description: La sucursal no fue encontrada
 *       500:
 *         description: Error en el servidor
 */
const updateSucursal = async (req, res) => {
  try {
    const { id } = req.params;
    const { empresa_id } = req.body;
    
    if (empresa_id) {
       const empresa = await Empresa.findByPk(empresa_id);
       if (!empresa) return res.status(404).json({ error: 'Empresa no encontrada' });
    }
    
    const [updated] = await Sucursal.update(req.body, { where: { id } });
    if (!updated) return res.status(404).json({ error: 'Sucursal no encontrada' });
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
 *         schema:
 *           type: string
 *         required: true
 *         description: El ID de la sucursal
 *     responses:
 *       200:
 *         description: La sucursal fue eliminada exitosamente
 *       404:
 *         description: La sucursal no fue encontrada
 */
const deleteSucursal = async (req, res) => {
  try {
    const deleted = await Sucursal.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'Sucursal no encontrada' });
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
