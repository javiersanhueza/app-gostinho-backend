const { Op } = require('sequelize');
const Usuario = require('../models/usuario.model');
const Empresa = require('../models/empresa.model');
const Sucursal = require('../models/sucursal.model');
const bcrypt = require('bcryptjs');
const ROLES = require('../config/roles');

const crearUsuario = async (req, res) => {
  try {
    const { nombre, email, password, rol, empresa_id, sucursal_id } = req.body;
    const creador = req.usuario;

    if (!nombre || !password) {
      return res.status(400).json({ error: 'El nombre y la contraseña son obligatorios' });
    }

    let dataToCreate = { nombre, email, rol, empresa_id, sucursal_id };

    if (creador.rol === ROLES.ADMIN_SISTEMA) {
      if (rol !== ROLES.ADMIN_EMPRESA) {
        return res.status(403).json({ error: 'Como ADMIN_SISTEMA, solo puedes crear usuarios con el rol ADMIN_EMPRESA.' });
      }
      if (!empresa_id) {
        return res.status(400).json({ error: 'Debes asignar el nuevo administrador a una empresa existente.' });
      }
      dataToCreate.rol = ROLES.ADMIN_EMPRESA;
      dataToCreate.sucursal_id = null;

    } else if (creador.rol === ROLES.ADMIN_EMPRESA) {
      if (rol === ROLES.ADMIN_SISTEMA || rol === ROLES.ADMIN_EMPRESA) {
        return res.status(403).json({ error: 'No tienes permisos para crear administradores de este nivel.' });
      }
      dataToCreate.empresa_id = creador.empresa_id;
      
      if (sucursal_id) {
        const sucursal = await Sucursal.findOne({ where: { id: sucursal_id, empresa_id: creador.empresa_id }});
        if (!sucursal) {
          return res.status(400).json({ error: 'La sucursal indicada no pertenece a tu empresa.' });
        }
      }
    } else {
      return res.status(403).json({ error: 'No tienes permisos para crear usuarios.' });
    }

    const salt = await bcrypt.genSalt(10);
    dataToCreate.password = await bcrypt.hash(password, salt);
    dataToCreate.activo = true;

    const nuevoUsuario = await Usuario.create(dataToCreate);

    const usuarioData = nuevoUsuario.toJSON();
    delete usuarioData.password;

    res.status(201).json({
      mensaje: 'Usuario creado exitosamente',
      data: usuarioData
    });

  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'El nombre o el correo ya están en uso.' });
    }
    console.error(error);
    res.status(500).json({ error: 'Error al crear el usuario.' });
  }
};

const obtenerUsuarios = async (req, res) => {
  try {
    const { page = 1, limit = 10, nombre, email, rol, activo, empresa_id } = req.query;
    const creador = req.usuario;
    const offset = (page - 1) * limit;

    let whereClause = {};

    // Filtros de búsqueda
    if (nombre) whereClause.nombre = { [Op.like]: `%${nombre}%` };
    if (email) whereClause.email = { [Op.like]: `%${email}%` };
    if (rol) whereClause.rol = rol;
    if (activo !== undefined) whereClause.activo = (activo === 'true');

    // Lógica de permisos y filtros de seguridad
    if (creador.rol === ROLES.ADMIN_EMPRESA) {
      whereClause.empresa_id = creador.empresa_id;
    } else if (creador.rol === ROLES.ADMIN_SISTEMA && empresa_id) {
      whereClause.empresa_id = empresa_id;
    } else if (creador.rol === ROLES.ADMIN_SUCURSAL) {
      whereClause.sucursal_id = creador.sucursal_id;
    }

    const { count, rows } = await Usuario.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      include: [
        { model: Empresa, as: 'empresa', attributes: ['id', 'nombre'] },
        { model: Sucursal, as: 'sucursal', attributes: ['id', 'nombre'] }
      ],
      order: [['nombre', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: rows
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los usuarios' });
  }
};

const editarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, rol, activo, password, sucursal_id } = req.body;
    const creador = req.usuario;

    const usuarioExistente = await Usuario.findByPk(id);
    if (!usuarioExistente) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (creador.rol === ROLES.ADMIN_EMPRESA && usuarioExistente.empresa_id !== creador.empresa_id) {
       return res.status(403).json({ error: 'No puedes editar usuarios de otra empresa' });
    }
    if (creador.rol === ROLES.ADMIN_SUCURSAL && usuarioExistente.sucursal_id !== creador.sucursal_id) {
       return res.status(403).json({ error: 'No puedes editar usuarios de otra sucursal' });
    }

    let dataActualizar = { nombre, email, rol, activo, sucursal_id };

    if ((rol === ROLES.ADMIN_EMPRESA || (!rol && usuarioExistente.rol === ROLES.ADMIN_EMPRESA))) {
       dataActualizar.sucursal_id = null;
    } else if (sucursal_id && creador.rol === ROLES.ADMIN_EMPRESA) {
        const sucursal = await Sucursal.findOne({ where: { id: sucursal_id, empresa_id: creador.empresa_id }});
        if (!sucursal) {
           return res.status(400).json({ error: 'La sucursal indicada no pertenece a tu empresa' });
        }
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      dataActualizar.password = await bcrypt.hash(password, salt);
    }

    await Usuario.update(dataActualizar, { where: { id } });
    const usuarioActualizado = await Usuario.findByPk(id, { attributes: { exclude: ['password'] } });
    res.json({ mensaje: 'Usuario actualizado', data: usuarioActualizado });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'El nombre o correo ya están en uso' });
    }
    res.status(500).json({ error: 'Error al actualizar el usuario' });
  }
};

const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const creador = req.usuario;

    if (id === creador.id) {
      return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta' });
    }

    const usuarioExistente = await Usuario.findByPk(id);
    if (!usuarioExistente) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (creador.rol === ROLES.ADMIN_EMPRESA && usuarioExistente.empresa_id !== creador.empresa_id) {
       return res.status(403).json({ error: 'No puedes desactivar usuarios de otra empresa' });
    }
    if (creador.rol === ROLES.ADMIN_SUCURSAL && usuarioExistente.sucursal_id !== creador.sucursal_id) {
       return res.status(403).json({ error: 'No puedes desactivar usuarios de otra sucursal' });
    }

    await Usuario.update({ activo: false }, { where: { id } });
    res.json({ mensaje: 'Usuario desactivado correctamente.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al desactivar el usuario' });
  }
};

module.exports = { crearUsuario, obtenerUsuarios, editarUsuario, eliminarUsuario };
