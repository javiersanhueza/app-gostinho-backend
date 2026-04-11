const prisma = require('../config/db');

// 1. Crear un restaurante nuevo
const crearRestaurante = async (req, res) => {
  try {
    const { nombre } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre del restaurante es requerido' });
    }

    const nuevoRestaurante = await prisma.restaurantes.create({
      data: { nombre }
    });

    res.status(201).json({ data: nuevoRestaurante });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el restaurante' });
  }
};

// 2. FUNCIÓN ESPECIAL: Inicializar tu local y migrar usuarios antiguos
const inicializarSaaS = async (req, res) => {
  try {
    // A. Buscamos si ya creaste el local principal para no duplicarlo
    let miLocal = await prisma.restaurantes.findFirst({
      where: { nombre: 'Gostinho Food Truck' }
    });

    // B. Si no existe, lo creamos
    if (!miLocal) {
      miLocal = await prisma.restaurantes.create({
        data: {
          nombre: 'Gostinho Food Truck',
          suscripcionActiva: true
        }
      });
    }

    // C. Buscamos todos los usuarios huérfanos (que tienen restaurante_id en null)
    const usuariosHuerfanos = await prisma.usuarios.findMany({
      where: { restaurante_id: null }
    });

    // D. Si hay usuarios huérfanos, los actualizamos para que pertenezcan a Gostinho
    if (usuariosHuerfanos.length > 0) {
      await prisma.usuarios.updateMany({
        where: { restaurante_id: null },
        data: { restaurante_id: miLocal.id }
      });
    }

    res.json({
      mensaje: '¡Migración a SaaS completada con éxito!',
      restaurante: miLocal,
      usuariosActualizados: usuariosHuerfanos.length
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al inicializar el sistema SaaS' });
  }
};

const editarRestaurante = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, suscripcionActiva } = req.body;

    const restauranteActualizado = await prisma.restaurantes.update({
      where: { id },
      data: { nombre, suscripcionActiva }
    });

    res.json({ data: restauranteActualizado, mensaje: 'Restaurante actualizado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el restaurante' });
  }
};

// Eliminar (o desactivar) un restaurante
const toggleEstatusRestaurante = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Primero buscamos el restaurante para saber su estado actual
    const restauranteActual = await prisma.restaurantes.findUnique({
      where: { id },
      select: { suscripcionActiva: true, nombre: true }
    });

    if (!restauranteActual) {
      return res.status(404).json({ error: 'Restaurante no encontrado' });
    }

    // 2. Invertimos el estado (si estaba true pasa a false, y viceversa)
    const nuevoEstado = !restauranteActual.suscripcionActiva;

    const restauranteActualizado = await prisma.restaurantes.update({
      where: { id },
      data: { suscripcionActiva: nuevoEstado }
    });

    res.json({
      mensaje: `Restaurante ${restauranteActualizado.nombre} ha sido ${nuevoEstado ? 'activado' : 'desactivado'}`,
      data: restauranteActualizado
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cambiar el estatus del restaurante' });
  }
};

const obtenerRestaurantes = async (req, res) => {
  try {
    const restaurantes = await prisma.restaurantes.findMany({
      orderBy: {
        // Asumiendo que tienes created_at, si no, usa nombre
        created_at: 'desc'
      }
    });

    res.json({
      data: restaurantes,
      count: restaurantes.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener la lista de restaurantes' });
  }
};

module.exports = {
  crearRestaurante,
  inicializarSaaS,
  editarRestaurante,
  toggleEstatusRestaurante,
  obtenerRestaurantes
};
