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
      where: { telefono }
    });

    if (clienteExistente) {
      return res.status(400).json({ error: 'Este teléfono ya está registrado.' });
    }

    const nuevoCliente = await Cliente.create({
      nombre,
      telefono,
      email
    });

    // Crear la billetera para la empresa desde donde se crea (POS)
    if (empresa_id) {
      const BilleteraFidelidad = require('../models/billetera_fidelidad.model');
      await BilleteraFidelidad.create({
        cliente_id: nuevoCliente.id,
        empresa_id: empresa_id
      });
    }

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
    const BilleteraFidelidad = require('../models/billetera_fidelidad.model');

    const billeteras = await BilleteraFidelidad.findAll({
      where: { empresa_id },
      include: [{
        model: Cliente,
        as: 'cliente'
      }],
      order: [['puntos', 'DESC']]
    });

    const clientes = billeteras.map(b => {
      if (!b.cliente) return null;
      const c = b.cliente.toJSON();
      c.puntos = b.puntos;
      c.puntos_lealtad = b.puntos; // Mantenemos retrocompatibilidad si el frontend lo usa
      c.sellos = b.sellos; // Agregamos los sellos
      c.billetera_id = b.id;
      return c;
    }).filter(c => c !== null);

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
    const empresa_id = req.usuario ? req.usuario.empresa_id : null;

    const cliente = await Cliente.findOne({
      where: { telefono }
    });

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    if (empresa_id) {
      const BilleteraFidelidad = require('../models/billetera_fidelidad.model');
      const billetera = await BilleteraFidelidad.findOne({ where: { cliente_id: cliente.id, empresa_id } });
      const data = cliente.toJSON();
      data.puntos = billetera ? billetera.puntos : 0;
      data.puntos_lealtad = data.puntos;
      data.sellos = billetera ? billetera.sellos : 0;
      return res.json({ data });
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

    const BilleteraFidelidad = require('../models/billetera_fidelidad.model');
    
    // Buscar billetera de fidelidad, si no existe la creamos
    let billetera = await BilleteraFidelidad.findOne({
      where: { cliente_id: id, empresa_id }
    });

    if (!billetera) {
      const cliente = await Cliente.findByPk(id);
      if (!cliente) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }
      billetera = await BilleteraFidelidad.create({
        cliente_id: id,
        empresa_id,
        puntos: 0
      });
    }

    billetera.puntos += puntosGanados;
    await billetera.save();

    res.json({
      mensaje: `¡Se han sumado ${puntosGanados} puntos!`,
      data: billetera
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
    if (!telefono) return res.status(400).json({ error: 'Teléfono es requerido' });

    const cliente = await Cliente.findOne({
      where: { telefono }
    });

    if (!cliente) {
      return res.status(404).json({ error: 'Número no registrado. Regístrate en tu local más cercano.' });
    }

    // Traer las billeteras del cliente (sus puntos en distintas empresas)
    const BilleteraFidelidad = require('../models/billetera_fidelidad.model');
    const Empresa = require('../models/empresa.model');
    const billeteras = await BilleteraFidelidad.findAll({
      where: { cliente_id: cliente.id },
      include: [{ model: Empresa, as: 'empresa', attributes: ['id', 'nombre', 'logo_url'] }]
    });

    const payload = {
      id: cliente.id,
      roles: ['CLIENTE']
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });

    const clienteData = cliente.toJSON();
    clienteData.billeteras = billeteras;

    res.status(200).json({
      mensaje: 'Login exitoso',
      token,
      cliente: clienteData
    });
  } catch (error) {
    logger.error('Error en login de cliente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// 6. Autoregistro de Cliente (Loyalty App)
const registroCliente = async (req, res) => {
  try {
    const { telefono, nombre } = req.body;
    
    let cliente = await Cliente.findOne({ where: { telefono } });
    if (cliente) {
      return res.status(400).json({ error: 'El teléfono ya está registrado. Inicia sesión.' });
    }

    cliente = await Cliente.create({
      telefono,
      nombre
    });

    const payload = {
      id: cliente.id,
      roles: ['CLIENTE']
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      mensaje: 'Registro exitoso',
      token,
      cliente
    });
  } catch (error) {
    logger.error('Error en registro de cliente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const actualizarPerfilCliente = async (req, res) => {
  try {
    const clienteId = req.usuario.id;
    const { nombre, email } = req.body;

    const cliente = await Cliente.findByPk(clienteId);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    if (nombre) cliente.nombre = nombre;
    if (email !== undefined) cliente.email = email;

    await cliente.save();

    res.json(cliente);
  } catch (error) {
    logger.error('Error actualizando perfil del cliente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const obtenerPerfilCliente = async (req, res) => {
  try {
    const clienteId = req.usuario.id;
    const cliente = await Cliente.findByPk(clienteId);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json(cliente);
  } catch (error) {
    logger.error('Error obteniendo perfil del cliente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { crearCliente, obtenerClientes, buscarPorTelefono, sumarPuntos, loginCliente, registroCliente, actualizarPerfilCliente, obtenerPerfilCliente };