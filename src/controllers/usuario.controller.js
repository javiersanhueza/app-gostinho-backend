const prisma = require('../config/db');
const bcrypt = require('bcryptjs');

const crearUsuario = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    // Extraemos quién está haciendo esta petición desde el token
    const creador = req.usuario;

    if (!nombre || !password) {
      return res.status(400).json({ error: 'El nombre y la contraseña son obligatorios' });
    }

    // 1. Validar jerarquía de roles
    // Un dueño de local no puede crear un super-administrador del sistema
    if (rol === 'ADMIN_SISTEMA' && creador.rol !== 'ADMIN_SISTEMA') {
      return res.status(403).json({ error: 'No tienes permisos para crear un administrador del sistema' });
    }

    // 2. Asignar el restaurante automáticamente
    let restaurante_id_asignado = creador.restaurante_id;

    // (Opcional) Si TÚ (ADMIN_SISTEMA) estás creando al dueño de un local nuevo,
    // tú le envías el ID del restaurante en el body.
    if (creador.rol === 'ADMIN_SISTEMA' && req.body.restaurante_id) {
      restaurante_id_asignado = req.body.restaurante_id;
    }

    // 3. Encriptar la contraseña (¡NUNCA guardar en texto plano!)
    const salt = await bcrypt.genSalt(10);
    const passwordEncriptada = await bcrypt.hash(password, salt);

    // 4. Guardar en la base de datos
    const nuevoUsuario = await prisma.usuarios.create({
      data: {
        nombre,
        email,
        password: passwordEncriptada,
        rol: rol || 'CAJERO', // Por defecto será cajero si no envían rol
        restaurante_id: restaurante_id_asignado,
        activo: true
      }
    });

    // 5. Borramos la contraseña de la respuesta por seguridad
    delete nuevoUsuario.password;

    res.status(201).json({
      mensaje: 'Usuario creado exitosamente',
      data: nuevoUsuario
    });

  } catch (error) {
    console.error(error);
    // Manejo de error si el nombre o email ya existen
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'El nombre o el correo ya están en uso' });
    }
    res.status(500).json({ error: 'Error al crear el usuario' });
  }
};

// 2. Obtener todos los usuarios del local
const obtenerUsuarios = async (req, res) => {
  try {
    const restaurante_id = req.usuario.restaurante_id;

    const usuarios = await prisma.usuarios.findMany({
      where: { restaurante_id },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        created_at: true
        // Omitimos intencionalmente el 'password' aquí por seguridad
      },
      orderBy: { created_at: 'desc' }
    });

    res.json({ data: usuarios });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los usuarios' });
  }
};

// 3. Editar un usuario
const editarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, rol, activo, password } = req.body;
    const creador = req.usuario;

    // Verificar que el usuario a editar pertenezca al mismo restaurante
    const usuarioExistente = await prisma.usuarios.findFirst({
      where: { id, restaurante_id: creador.restaurante_id }
    });

    if (!usuarioExistente) {
      return res.status(404).json({ error: 'Usuario no encontrado en este local' });
    }

    // Preparamos los datos a actualizar
    let dataActualizar = { nombre, email, rol, activo };

    // Si enviaron una nueva contraseña, la encriptamos
    if (password) {
      const salt = await bcrypt.genSalt(10);
      dataActualizar.password = await bcrypt.hash(password, salt);
    }

    const usuarioActualizado = await prisma.usuarios.update({
      where: { id },
      data: dataActualizar,
      select: {
        id: true, nombre: true, email: true, rol: true, activo: true
      }
    });

    res.json({ mensaje: 'Usuario actualizado', data: usuarioActualizado });
  } catch (error) {
    if (error.code === 'P2002') {
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

    // Verificamos que el usuario pertenezca al local
    const usuarioExistente = await prisma.usuarios.findFirst({
      where: { id, restaurante_id: creador.restaurante_id }
    });

    if (!usuarioExistente) {
      return res.status(404).json({ error: 'Usuario no encontrado en este local' });
    }

    // Soft Delete: Lo marcamos como inactivo
    await prisma.usuarios.update({
      where: { id },
      data: { activo: false }
    });

    res.json({ mensaje: 'Usuario desactivado correctamente. Ya no podrá iniciar sesión.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al desactivar el usuario' });
  }
};

// Exportamos todo al final del archivo
module.exports = { crearUsuario, obtenerUsuarios, editarUsuario, eliminarUsuario };