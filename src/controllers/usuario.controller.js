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

    // 1. Validar jerarquía de roles
    // Un ADMIN_EMPRESA o ADMIN_SUCURSAL no puede crear un super-administrador del sistema
    if (rol === ROLES.ADMIN_SISTEMA && creador.rol !== ROLES.ADMIN_SISTEMA) {
      return res.status(403).json({ error: 'No tienes permisos para crear un administrador del sistema' });
    }

    // 2. Asignar empresa y sucursal según quién crea el usuario
    let empresa_id_asignado = creador.empresa_id;
    let sucursal_id_asignada = creador.sucursal_id;

    if (creador.rol === ROLES.ADMIN_SISTEMA) {
      // El ADMIN_SISTEMA puede asignar cualquier empresa y sucursal, o dejar en null
      empresa_id_asignado = empresa_id || null;
      sucursal_id_asignada = sucursal_id || null;
    } else if (creador.rol === ROLES.ADMIN_EMPRESA) {
      // El ADMIN_EMPRESA crea usuarios para su propia empresa, y puede asignar sucursales
      empresa_id_asignado = creador.empresa_id;
      sucursal_id_asignada = sucursal_id || null;
      
      // Asegurarnos de que la sucursal asignada pertenece a la empresa
      if (sucursal_id_asignada) {
         const sucursal = await Sucursal.findOne({ where: { id: sucursal_id_asignada, empresa_id: empresa_id_asignado }});
         if (!sucursal) {
             return res.status(400).json({ error: 'La sucursal indicada no pertenece a tu empresa' });
         }
      }
    }

    // Un ADMIN_EMPRESA no debe estar atado a una sucursal en específico
    if (rol === ROLES.ADMIN_EMPRESA) {
      sucursal_id_asignada = null;
    }

    // 3. Encriptar la contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordEncriptada = await bcrypt.hash(password, salt);

    // 4. Guardar en la base de datos
    const nuevoUsuario = await Usuario.create({
      nombre,
      email,
      password: passwordEncriptada,
      rol: rol || ROLES.CAJERO,
      empresa_id: empresa_id_asignado,
      sucursal_id: sucursal_id_asignada,
      activo: true
    });

    // 5. Borramos la contraseña de la respuesta por seguridad
    const usuarioData = nuevoUsuario.toJSON();
    delete usuarioData.password;

    res.status(201).json({
      mensaje: 'Usuario creado exitosamente',
      data: usuarioData
    });

  } catch (error) {
    console.error(error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'El nombre o el correo ya están en uso' });
    }
    res.status(500).json({ error: 'Error al crear el usuario' });
  }
};

// 2. Obtener todos los usuarios permitidos según el rol
const obtenerUsuarios = async (req, res) => {
  try {
    const creador = req.usuario;
    let whereClause = {};

    if (creador.rol === ROLES.ADMIN_EMPRESA) {
      // Ve a todos los usuarios de su empresa
      whereClause.empresa_id = creador.empresa_id;
    } else if (creador.rol === ROLES.ADMIN_SUCURSAL) {
       // Ve solo a los usuarios de su sucursal
      whereClause.sucursal_id = creador.sucursal_id;
    } else if (creador.rol !== ROLES.ADMIN_SISTEMA) {
      // Si no es ninguno de los admin, no debería poder ver la lista
      return res.status(403).json({ error: 'No tienes permisos para ver usuarios' });
    }

    const usuarios = await Usuario.findAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      include: [
        { model: Empresa, as: 'empresa', attributes: ['id', 'nombre'] },
        { model: Sucursal, as: 'sucursal', attributes: ['id', 'nombre'] }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({ data: usuarios });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los usuarios' });
  }
};

// 3. Editar un usuario
const editarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, rol, activo, password, sucursal_id } = req.body;
    const creador = req.usuario;

    // Verificar que el usuario a editar exista
    const usuarioExistente = await Usuario.findByPk(id);

    if (!usuarioExistente) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Validar permisos de edición
    if (creador.rol === ROLES.ADMIN_EMPRESA && usuarioExistente.empresa_id !== creador.empresa_id) {
       return res.status(403).json({ error: 'No puedes editar usuarios de otra empresa' });
    }
    if (creador.rol === ROLES.ADMIN_SUCURSAL && usuarioExistente.sucursal_id !== creador.sucursal_id) {
       return res.status(403).json({ error: 'No puedes editar usuarios de otra sucursal' });
    }

    // Preparamos los datos a actualizar
    let dataActualizar = { nombre, email, rol, activo, sucursal_id };

    // Si es ADMIN_EMPRESA, asegurarse que no le asigne una sucursal a sí mismo o a otro admin_empresa
    if ((rol === ROLES.ADMIN_EMPRESA || (!rol && usuarioExistente.rol === ROLES.ADMIN_EMPRESA))) {
       dataActualizar.sucursal_id = null;
    } else if (sucursal_id && creador.rol === ROLES.ADMIN_EMPRESA) {
        // Validar que la nueva sucursal pertenece a la empresa
        const sucursal = await Sucursal.findOne({ where: { id: sucursal_id, empresa_id: creador.empresa_id }});
        if (!sucursal) {
           return res.status(400).json({ error: 'La sucursal indicada no pertenece a tu empresa' });
        }
    }

    // Si enviaron una nueva contraseña, la encriptamos
    if (password) {
      const salt = await bcrypt.genSalt(10);
      dataActualizar.password = await bcrypt.hash(password, salt);
    }

    await Usuario.update(dataActualizar, { where: { id } });

    const usuarioActualizado = await Usuario.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    res.json({ mensaje: 'Usuario actualizado', data: usuarioActualizado });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'El nombre o correo ya están en uso' });
    }
    res.status(500).json({ error: 'Error al actualizar el usuario' });
  }
};

// 4. Eliminar (Desactivar) un usuario
const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const creador = req.usuario;

    // Evitar que el usuario se elimine a sí mismo por accidente
    if (id === creador.id) {
      return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta' });
    }

    const usuarioExistente = await Usuario.findByPk(id);

    if (!usuarioExistente) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Validar permisos de eliminación
    if (creador.rol === ROLES.ADMIN_EMPRESA && usuarioExistente.empresa_id !== creador.empresa_id) {
       return res.status(403).json({ error: 'No puedes desactivar usuarios de otra empresa' });
    }
    if (creador.rol === ROLES.ADMIN_SUCURSAL && usuarioExistente.sucursal_id !== creador.sucursal_id) {
       return res.status(403).json({ error: 'No puedes desactivar usuarios de otra sucursal' });
    }

    // Soft Delete: Lo marcamos como inactivo
    await Usuario.update({ activo: false }, { where: { id } });

    res.json({ mensaje: 'Usuario desactivado correctamente. Ya no podrá iniciar sesión.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al desactivar el usuario' });
  }
};

module.exports = { crearUsuario, obtenerUsuarios, editarUsuario, eliminarUsuario };