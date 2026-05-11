const Usuario = require('../models/usuario.model');
const Empresa = require('../models/empresa.model'); // Sustituye a Restaurante según tu nuevo modelo
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión en el sistema
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@gostinho.cl
 *               password:
 *                 type: string
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Login exitoso
 *       401:
 *         description: Contraseña incorrecta
 *       404:
 *         description: Usuario no encontrado
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Sequelize: findOne con relación a Empresa (antes Restaurante)
    const usuario = await Usuario.findOne({
      where: { email },
      include: [{ model: Empresa, as: 'empresa' }]
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (!usuario.activo) {
      return res.status(403).json({ error: 'El usuario ha sido desactivado' });
    }

    // Validación de suscripción multitenant
    if (usuario.empresa && usuario.empresa.suscripcionActiva === false) {
      return res.status(403).json({
        error: 'Suscripción inactiva. Por favor, contacta a soporte.'
      });
    }

    const passwordValida = await bcrypt.compare(password, usuario.password);

    if (!passwordValida) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const payload = {
      id: usuario.id,
      rol: usuario.rol,
      empresa_id: usuario.empresa_id
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '8h'
    });

    const usuarioData = usuario.toJSON();
    delete usuarioData.password;

    res.json({
      mensaje: 'Login exitoso',
      token,
      usuario: usuarioData
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

module.exports = { login };
