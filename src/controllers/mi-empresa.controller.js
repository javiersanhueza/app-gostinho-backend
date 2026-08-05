const logger = require('../utils/logger');
const Empresa = require('../models/empresa.model');
const Plan = require('../models/plan.model');
const { upload } = require('../config/cloudinary');

// Subir o actualizar el logo de la empresa
const uploadLogo = async (req, res) => {
  try {
    const empresaId = req.usuario.empresa_id;

    if (!empresaId) {
      return res.status(403).json({ error: 'El usuario no tiene una empresa asignada.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo de imagen.' });
    }

    // req.file.path contendrá la URL de Cloudinary gracias a multer-storage-cloudinary
    const logoUrl = req.file.path;

    // Actualizar la empresa
    const empresa = await Empresa.findByPk(empresaId);
    
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa no encontrada.' });
    }

    empresa.logo_url = logoUrl;
    await empresa.save();

    res.json({
      success: true,
      message: 'Logo actualizado correctamente',
      logo_url: logoUrl
    });
  } catch (error) {
    logger.error('Error al subir logo:', error.message || error, error.stack);
    res.status(500).json({ error: 'Error interno al procesar el logo', details: error.message });
  }
};

// Obtener la información de la empresa del usuario
const getMiEmpresa = async (req, res) => {
  try {
    const empresaId = req.usuario.empresa_id;
    if (!empresaId) return res.status(403).json({ error: 'No tiene empresa asignada.' });

    const empresa = await Empresa.findByPk(empresaId, {
      include: [{ model: Plan, as: 'plan' }]
    });
    if (!empresa) return res.status(404).json({ error: 'Empresa no encontrada.' });

    res.json({ data: empresa });
  } catch (error) {
    logger.error('Error al obtener mi empresa:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

// Actualizar la información de la empresa
const updateMiEmpresa = async (req, res) => {
  try {
    const empresaId = req.usuario.empresa_id;
    if (!empresaId) return res.status(403).json({ error: 'No tiene empresa asignada.' });

    const { nombre } = req.body;
    
    const empresa = await Empresa.findByPk(empresaId);
    if (!empresa) return res.status(404).json({ error: 'Empresa no encontrada.' });

    if (nombre) empresa.nombre = nombre;
    await empresa.save();

    res.json({ success: true, message: 'Datos actualizados correctamente.', data: empresa });
  } catch (error) {
    logger.error('Error al actualizar mi empresa:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

module.exports = {
  uploadLogo,
  getMiEmpresa,
  updateMiEmpresa
};
