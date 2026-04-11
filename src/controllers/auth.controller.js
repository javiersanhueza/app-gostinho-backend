// src/controllers/auth.controller.js
const prisma = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const usuario = await prisma.usuarios.findUnique({
      where: { email },
      include: {
        restaurante: true
      }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (!usuario.activo) {
      return res.status(403).json({ error: 'El usuario ha sido desactivado' });
    }

    if (usuario.restaurante && usuario.restaurante.suscripcionActiva === false) {
      return res.status(403).json({
        error: 'El acceso está suspendido. La suscripción de este restaurante se encuentra inactiva. Por favor, contacta a soporte.'
      });
    }

    // 2. Verificar contraseña
    // Recuerda usar bcrypt si ya estás encriptando las claves. 
    // Si tus claves actuales están en texto normal, usa la validación simple temporalmente.
    const passwordValida = await bcrypt.compare(password, usuario.password);
    // const passwordValida = (password === usuario.password); 

    if (!passwordValida) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const payload = {
      id: usuario.id,
      rol: usuario.rol,
      restaurante_id: usuario.restaurante_id
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '8h'
    });

    delete usuario.password;

    res.json({
      mensaje: 'Login exitoso',
      token,
      usuario
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor al intentar iniciar sesión' });
  }
};

module.exports = { login };