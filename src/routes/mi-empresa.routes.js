const express = require('express');
const router = express.Router();
const miEmpresaController = require('../controllers/mi-empresa.controller');
const { verificarRol } = require('../middlewares/auth.middleware');
const ROLES = require('../config/roles');
const { upload } = require('../config/cloudinary');

// Solo ADMIN_EMPRESA puede gestionar estos datos de SU empresa
const rolesPermitidos = [ROLES.ADMIN_EMPRESA];

// Rutas para gestionar los detalles de la empresa
router.get('/', verificarRol(rolesPermitidos), miEmpresaController.getMiEmpresa);
router.put('/', verificarRol(rolesPermitidos), miEmpresaController.updateMiEmpresa);

// Ruta para subir/actualizar el logo
router.post('/logo', verificarRol(rolesPermitidos), (req, res, next) => {
  upload.single('logo')(req, res, (err) => {
    if (err) {
      console.error('Multer/Cloudinary Error:', err);
      return res.status(500).json({ error: 'Error de subida a Cloudinary', details: err });
    }
    next();
  });
}, miEmpresaController.uploadLogo);

module.exports = router;
