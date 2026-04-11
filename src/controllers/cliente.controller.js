// src/controllers/cliente.controller.js
const prisma = require('../config/db');

// 1. Registrar un nuevo cliente
const crearCliente = async (req, res) => {
  try {
    const { nombre, telefono } = req.body;
    // ¡MAGIA SAAS! Sacamos el restaurante del token del cajero
    const restaurante_id = req.usuario.restaurante_id;

    if (!restaurante_id) {
      return res.status(403).json({ error: 'Tu usuario no está asociado a ningún restaurante.' });
    }

    const nuevoCliente = await prisma.clientes.create({
      data: {
        nombre,
        telefono,
        restaurante_id
      }
    });

    res.status(201).json({ mensaje: 'Cliente registrado con éxito', data: nuevoCliente });
  } catch (error) {
    console.error(error);
    // Error P2002 es el código de Prisma cuando se viola una restricción @@unique
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Este número de teléfono ya está registrado en este local.' });
    }
    res.status(500).json({ error: 'Error al registrar el cliente' });
  }
};

// 2. Obtener TODOS los clientes (Solo los del local del cajero)
const obtenerClientes = async (req, res) => {
  try {
    const restaurante_id = req.usuario.restaurante_id;

    const clientes = await prisma.clientes.findMany({
      where: { restaurante_id },
      orderBy: { puntos_lealtad: 'desc' } // Los más fieles primero
    });

    res.json({ data: clientes });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los clientes' });
  }
};

// 3. Buscar cliente por teléfono (Rápido para la caja)
const buscarPorTelefono = async (req, res) => {
  try {
    const { telefono } = req.params;
    const restaurante_id = req.usuario.restaurante_id;

    const cliente = await prisma.clientes.findUnique({
      where: {
        telefono_restaurante_id: { telefono, restaurante_id }
      }
    });

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json({ data: cliente });
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar el cliente' });
  }
};

// 4. Sumar puntos de lealtad después de una compra
const sumarPuntos = async (req, res) => {
  try {
    const { id } = req.params;
    const { puntosGanados } = req.body; // Ej: Por cada $1000 pesos, 1 punto
    const restaurante_id = req.usuario.restaurante_id;

    // Actualizamos al cliente sumando los puntos nuevos a los que ya tenía
    const clienteActualizado = await prisma.clientes.update({
      where: {
        id,
        restaurante_id // Doble seguridad: Asegura que el cliente sea de este local
      },
      data: {
        puntos_lealtad: {
          increment: puntosGanados // Prisma hace la suma matemática por nosotros
        }
      }
    });

    res.json({
      mensaje: `¡Se han sumado ${puntosGanados} puntos!`,
      data: clienteActualizado
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al sumar puntos' });
  }
};

module.exports = { crearCliente, obtenerClientes, buscarPorTelefono, sumarPuntos };