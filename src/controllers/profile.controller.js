const Usuario = require('../models/usuario.model');
const bcrypt = require('bcryptjs');

/**
 * @swagger
 * tags:
 *   name: Perfil
 *   description: Gestión del perfil del usuario autenticado
 */

/**
 * @swagger
 * /profile/me:
 *   get:
 *     summary: Obtener los datos del perfil del usuario actual
 *     tags: [Perfil]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del perfil obtenidos exitosamente.
 *       404:
 *         description: Usuario no encontrado.
 */
const getMyProfile = async (req, res) => {
  try {
    // El ID del usuario se obtiene del token JWT que ya fue verificado por el middleware
    const userId = req.usuario.id;

    const usuario = await Usuario.findByPk(userId, {
      attributes: { exclude: ['password'] } // Nunca devolver la contraseña
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    res.json(usuario);
  } catch (error) {
    console.error('Error al obtener el perfil:', error);
    res.status(500).json({ error: 'Error interno al obtener el perfil.' });
  }
};

/**
 * @swagger
 * /profile/me:
 *   put:
 *     summary: Actualizar los datos del perfil del usuario actual
 *     tags: [Perfil]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 description: Enviar solo si se desea cambiar la contraseña.
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente.
 *       400:
 *         description: Error de validación o el email ya está en uso.
 */
const updateMyProfile = async (req, res) => {
  try {
    const userId = req.usuario.id;
    const { nombre, email, password } = req.body;

    const dataToUpdate = {};

    if (nombre) dataToUpdate.nombre = nombre;
    if (email) dataToUpdate.email = email;

    // Si el usuario envía una nueva contraseña, la encriptamos
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
      }
      const salt = await bcrypt.genSalt(10);
      dataToUpdate.password = await bcrypt.hash(password, salt);
    }

    const [updated] = await Usuario.update(dataToUpdate, {
      where: { id: userId }
    });

    if (!updated) {
      return res.status(404).json({ error: 'No se pudo actualizar el perfil.' });
    }

    const usuarioActualizado = await Usuario.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    res.json({
      mensaje: 'Perfil actualizado exitosamente.',
      usuario: usuarioActualizado
    });

  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'El email ingresado ya está en uso por otro usuario.' });
    }
    console.error('Error al actualizar el perfil:', error);
    res.status(500).json({ error: 'Error interno al actualizar el perfil.' });
  }
};

module.exports = { getMyProfile, updateMyProfile };
