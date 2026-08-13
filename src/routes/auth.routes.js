
const { Router } = require('express');
const { login, recuperarPassword, resetPassword, cambiarPassword } = require('../controllers/auth.controller');
const { verificarToken } = require('../middlewares/auth.middleware');

const router = Router();

// ... existing swagger doc for login ...
router.post('/login', login);

router.post('/recuperar-password', recuperarPassword);
router.post('/reset-password', resetPassword);

router.post('/cambiar-password', verificarToken, cambiarPassword);

module.exports = router;
