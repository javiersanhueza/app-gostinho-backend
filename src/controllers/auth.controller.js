const Usuario = require('../models/usuario.model');
const Empresa = require('../models/empresa.model');
const Rol = require('../models/rol.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

module.exports = { login };
