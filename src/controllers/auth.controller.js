const Usuario = require('../models/usuario.model');
const Empresa = require('../models/empresa.model');
const Rol = require('../models/rol.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { enviarCorreoRecuperacion } = require('../services/email.service');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Ahora incluimos la relación con Roles
    const usuario = await Usuario.findOne({
      where: { email },
      include: [
        { model: Empresa, as: 'empresa' },
        { model: Rol, as: 'roles', attributes: ['nombre'], through: { attributes: [] } } // Traemos solo el nombre del rol
      ]
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (!usuario.activo) {
      return res.status(403).json({ error: 'El usuario ha sido desactivado' });
    }

    if (usuario.empresa && !usuario.empresa.suscripcionActiva) {
      return res.status(403).json({ error: 'Suscripción inactiva. Contacta a soporte.' });
    }

    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    // Extraemos los nombres de los roles a un array de strings
    const roles = usuario.roles.map(rol => rol.nombre);

    // Creamos el nuevo payload con el array de roles
    const payload = {
      id: usuario.id,
      roles: roles, // Ej: ["ADMIN_EMPRESA", "CAJERO"]
      empresa_id: usuario.empresa_id,
      sucursal_id: usuario.sucursal_id
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

    // Preparamos la respuesta para el frontend
    const usuarioData = usuario.toJSON();
    delete usuarioData.password;
    // Reemplazamos el objeto complejo de roles por el array simple de strings
    usuarioData.roles = roles;

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

const recuperarPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'El email es obligatorio' });
    }

    const usuario = await Usuario.findOne({ where: { email } });

    if (!usuario) {
      // Devolver 200 siempre por seguridad (evitar enumeración de usuarios)
      return res.json({ mensaje: 'Si el correo existe, se han enviado las instrucciones.' });
    }

    // El secreto será la contraseña actual + el secreto JWT. 
    // Si la contraseña cambia, el token se invalida automáticamente.
    const secret = process.env.JWT_SECRET + usuario.password;
    
    // El payload contiene el id del usuario y expira en 15 minutos
    const payload = {
      email: usuario.email,
      id: usuario.id
    };
    
    const token = jwt.sign(payload, secret, { expiresIn: '15m' });

    // Enviar el correo
    await enviarCorreoRecuperacion(usuario.email, token, usuario.id);

    res.json({ mensaje: 'Si el correo existe, se han enviado las instrucciones.' });

  } catch (error) {
    console.error('Error en recuperarPassword:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, id, password } = req.body;

    if (!token || !id || !password) {
      return res.status(400).json({ error: 'Faltan parámetros requeridos.' });
    }

    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ error: 'Enlace inválido o expirado.' });
    }

    // Validar el token usando el mismo secreto con el que se firmó (incluye la contraseña antigua)
    const secret = process.env.JWT_SECRET + usuario.password;
    try {
      jwt.verify(token, secret);
    } catch (error) {
      return res.status(400).json({ error: 'Enlace inválido o expirado.' });
    }

    // Token válido. Hasheamos la nueva contraseña.
    const salt = await bcrypt.genSalt(10);
    usuario.password = await bcrypt.hash(password, salt);
    
    await usuario.save();

    res.json({ mensaje: 'Contraseña actualizada con éxito.' });

  } catch (error) {
    console.error('Error en resetPassword:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

module.exports = { login, recuperarPassword, resetPassword };
