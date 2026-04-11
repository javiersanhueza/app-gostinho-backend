const prisma = require('../config/db');

// 1. Obtener todos los planes (Para la tabla del Super Admin)
const obtenerPlanes = async (req, res) => {
  try {
    const planes = await prisma.planes.findMany({
      orderBy: { precioMensual: 'asc' } // Ordenamos del más barato al más caro
    });
    res.json({ data: planes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los planes' });
  }
};

// 2. Crear un nuevo plan
const crearPlan = async (req, res) => {
  try {
    const { nombre, descripcion, precioMensual, maxSucursales, maxUsuarios } = req.body;

    if (!nombre || precioMensual === undefined) {
      return res.status(400).json({ error: 'El nombre y el precio son obligatorios' });
    }

    const nuevoPlan = await prisma.planes.create({
      data: {
        nombre,
        descripcion,
        precioMensual,
        maxSucursales: maxSucursales || 1,
        maxUsuarios: maxUsuarios || 3,
        activo: true
      }
    });

    res.status(201).json({ mensaje: 'Plan creado con éxito', data: nuevoPlan });
  } catch (error) {
    console.error(error);
    // Manejo de error si el nombre del plan ya existe (restricción @unique)
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe un plan con ese nombre' });
    }
    res.status(500).json({ error: 'Error al crear el plan' });
  }
};

// 3. Editar un plan existente
const editarPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precioMensual, maxSucursales, maxUsuarios } = req.body;

    const planActualizado = await prisma.planes.update({
      where: { id },
      data: {
        nombre,
        descripcion,
        precioMensual,
        maxSucursales,
        maxUsuarios
      }
    });

    res.json({ mensaje: 'Plan actualizado', data: planActualizado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el plan' });
  }
};

// 4. Activar / Desactivar Plan (Soft Delete)
// Si lo desactivas, nadie nuevo puede contratarlo, pero los que ya lo tienen siguen funcionando.
const toggleEstadoPlan = async (req, res) => {
  try {
    const { id } = req.params;

    const planActual = await prisma.planes.findUnique({
      where: { id },
      select: { activo: true, nombre: true }
    });

    if (!planActual) {
      return res.status(404).json({ error: 'Plan no encontrado' });
    }

    const nuevoEstado = !planActual.activo;

    const planActualizado = await prisma.planes.update({
      where: { id },
      data: { activo: nuevoEstado }
    });

    res.json({
      mensaje: `El plan ${planActualizado.nombre} ahora está ${nuevoEstado ? 'activo' : 'inactivo'}`,
      data: planActualizado
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cambiar el estado del plan' });
  }
};

module.exports = {
  obtenerPlanes,
  crearPlan,
  editarPlan,
  toggleEstadoPlan
};