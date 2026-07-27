
const { Router } = require('express');
const { login, recuperarPassword, resetPassword } = require('../controllers/auth.controller');

const router = Router();

// ... existing swagger doc for login ...
router.post('/login', login);

router.post('/recuperar-password', recuperarPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
