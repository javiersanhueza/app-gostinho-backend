const logger = require('../utils/logger');
const Cliente = require('../models/cliente.model');
const jwt = require('jsonwebtoken');

// 1. Registrar un nuevo cliente (desde POS o Admin)
const crearCliente = async (req, res) => {
  try {
    const { nombre, telefono, email } = req.body;
    const empresa_id = req.usuario.empresa_id;

    if (!empresa_id) {
      return res.status(403).json({ error: 'Usuario no asociado a una empresa.' });
    }

    const clienteExistente = await Cliente.findOne({
      where: { telefono, empresa_id }
    });

    if (clienteExistente) {
      return res.status(400).json({ error: 'Este teléfono ya está registrado.' });
    }

    const nuevoCliente = await Cliente.create({
      nombre,
      telefono,
      email,
      empresa_id
    });

    res.status(201).json({ mensaje: 'Cliente registrado con éxito', data: nuevoCliente });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Error al registrar el cliente' });
  }
};

// 2. Obtener clientes (Admin/POS)
const obtenerClientes = async (req, res) => {
  try {
    const empresa_id = req.usuario.empresa_id;

    const clientes = await Cliente.findAll({
      where: { empresa_id },
      order: [['puntos_lealtad', 'DESC']]
    });

    res.json({ data: clientes });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Error al obtener los clientes' });
  }
};

// 3. Buscar cliente por teléfono (POS)
const buscarPorTelefono = async (req, res) => {
  try {
    const { telefono } = req.params;
    const empresa_id = req.usuario.empresa_id;

    const cliente = await Cliente.findOne({
      where: { telefono, empresa_id }
    });

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json({ data: cliente });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Error al buscar el cliente' });
  }
};

// 4. Sumar puntos (POS)
const sumarPuntos = async (req, res) => {
  try {
    const { id } = req.params;
    const { puntosGanados } = req.body;
    const empresa_id = req.usuario.empresa_id;

    const cliente = await Cliente.findOne({
      where: { id, empresa_id }
    });

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    cliente.puntos_lealtad += puntosGanados;
    await cliente.save();

    res.json({
      mensaje: `¡Se han sumado ${puntosGanados} puntos!`,
      data: cliente
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Error al sumar puntos' });
  }
};

// 5. Login de Cliente (Loyalty App)
const loginCliente = async (req, res) => {
  try {
    const { telefono } = req.body;
    // Buscamos al cliente por teléfono en cualquier empresa por ahora (o la primera que encuentre)
    // En el futuro, la app debería mandar un identificador de empresa (slug) si es marca blanca
    const cliente = await Cliente.findOne({
      where: { telefono }
    });

    if (!cliente) {
      // Si no existe, podríamos auto-registrarlo o pedirle que se registre
      return res.status(404).json({ error: 'Número no registrado. Regístrate en tu local más cercano.' });
    }

    const payload = {
      id: cliente.id,
      roles: ['CLIENTE'],
      empresa_id: cliente.empresa_id
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({
      mensaje: 'Login exitoso',
      token,
      cliente
    });
  } catch (error) {
    logger.error('Error en login de cliente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { crearCliente, obtenerClientes, buscarPorTelefono, sumarPuntos, loginCliente };