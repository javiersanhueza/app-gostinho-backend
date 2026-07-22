const { Op } = require('sequelize');
const Usuario = require('../models/usuario.model');
const Empresa = require('../models/empresa.model');
const Sucursal = require('../models/sucursal.model');
const Rol = require('../models/rol.model');
const bcrypt = require('bcryptjs');
const ROLES = require('../config/roles');
const sequelize = require('../config/db');

const crearUsuario = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { nombre, email, password, roles: rolesNombres, empresa_id, sucursal_id } = req.body;
    const creador = req.usuario;

    if (!nombre || !password) {
      return res.status(400).json({ error: 'El nombre y la contraseña son obligatorios' });
    }
    if (!rolesNombres || !Array.isArray(rolesNombres) || rolesNombres.length === 0) {
        return res.status(400).json({ error: 'El usuario debe tener al menos un rol.' });
    }

    let dataToCreate = { nombre, email, empresa_id, sucursal_id };

    if (creador.roles.includes(ROLES.ADMIN_SISTEMA)) {
      if (rolesNombres.length > 1 || rolesNombres[0] !== ROLES.ADMIN_EMPRESA) {
        return res.status(403).json({ error: 'Como ADMIN_SISTEMA, solo puedes crear usuarios con el único rol de ADMIN_EMPRESA.' });
      }
      if (!empresa_id) {
        return res.status(400).json({ error: 'Debes asignar el nuevo administrador a una empresa.' });
      }
      dataToCreate.sucursal_id = null;

    } else if (creador.roles.includes(ROLES.ADMIN_EMPRESA)) {
      if (rolesNombres.some(r => [ROLES.ADMIN_SISTEMA, ROLES.ADMIN_EMPRESA].includes(r))) {
        return res.status(403).json({ error: 'No tienes permisos para asignar roles de administrador.' });
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

    const nuevoUsuario = await Usuario.create(dataToCreate, { transaction: t });

    const rolesDB = await Rol.findAll({ where: { nombre: rolesNombres }, transaction: t });
    if (rolesDB.length !== rolesNombres.length) {
        await t.rollback();
        return res.status(400).json({ error: 'Uno o más roles especificados no son válidos.' });
    }

    await nuevoUsuario.setRoles(rolesDB, { transaction: t });

    await t.commit();

    const usuarioData = nuevoUsuario.toJSON();
    delete usuarioData.password;
    usuarioData.roles = rolesNombres;

    res.status(201).json({
      mensaje: 'Usuario creado exitosamente',
      data: usuarioData
    });

  } catch (error) {
    await t.rollback();
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
    let includeRolWhere = {};

    if (nombre) whereClause.nombre = { [Op.like]: `%${nombre}%` };
    if (email) whereClause.email = { [Op.like]: `%${email}%` };
    if (activo !== undefined) whereClause.activo = (activo === 'true');
    if (rol) includeRolWhere.nombre = rol;

    if (creador.roles.includes(ROLES.ADMIN_EMPRESA)) {
      whereClause.empresa_id = creador.empresa_id;
    } else if (creador.roles.includes(ROLES.ADMIN_SISTEMA) && empresa_id) {
      whereClause.empresa_id = empresa_id;
    } else if (creador.roles.includes(ROLES.ADMIN_SUCURSAL)) {
      whereClause.sucursal_id = creador.sucursal_id;
    }

    const { count, rows } = await Usuario.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      include: [
        { model: Empresa, as: 'empresa', attributes: ['id', 'nombre'] },
        { model: Sucursal, as: 'sucursal', attributes: ['id', 'nombre'] },
        { model: Rol, as: 'roles', where: includeRolWhere, attributes: ['nombre'], through: { attributes: [] } }
      ],
      order: [['nombre', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    const usuarios = rows.map(u => {
        const plainUser = u.toJSON();
        plainUser.roles = plainUser.roles.map(r => r.nombre);
        return plainUser;
    });

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: usuarios
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los usuarios' });
  }
};

const editarUsuario = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { nombre, email, roles: rolesNombres, activo, password, sucursal_id } = req.body;
    const creador = req.usuario;

    const usuario = await Usuario.findByPk(id, { transaction: t });
    if (!usuario) {
      await t.rollback();
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (creador.roles.includes(ROLES.ADMIN_EMPRESA) && usuario.empresa_id !== creador.empresa_id) {
       await t.rollback();
       return res.status(403).json({ error: 'No puedes editar usuarios de otra empresa' });
    }

    let dataActualizar = { nombre, email, activo, sucursal_id };
    if (password) {
      const salt = await bcrypt.genSalt(10);
      dataActualizar.password = await bcrypt.hash(password, salt);
    }

    await usuario.update(dataActualizar, { transaction: t });

    if (rolesNombres && Array.isArray(rolesNombres)) {
      const rolesDB = await Rol.findAll({ where: { nombre: rolesNombres }, transaction: t });
      if (rolesDB.length !== rolesNombres.length) {
          await t.rollback();
          return res.status(400).json({ error: 'Uno o más roles especificados no son válidos.' });
      }
      await usuario.setRoles(rolesDB, { transaction: t });
    }

    await t.commit();
    res.json({ mensaje: 'Usuario actualizado exitosamente.' });
  } catch (error) {
    await t.rollback();
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

    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (creador.roles.includes(ROLES.ADMIN_EMPRESA) && usuario.empresa_id !== creador.empresa_id) {
       return res.status(403).json({ error: 'No puedes desactivar usuarios de otra empresa' });
    }

    await usuario.update({ activo: false });
    res.json({ mensaje: 'Usuario desactivado correctamente.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al desactivar el usuario' });
  }
};

module.exports = { crearUsuario, obtenerUsuarios, editarUsuario, eliminarUsuario };
