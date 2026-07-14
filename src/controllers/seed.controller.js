const sequelize = require('../config/db');
const Plan = require('../models/plan.model');
const Usuario = require('../models/usuario.model');
const bcrypt = require('bcryptjs');
const ROLES = require('../config/roles');

const ejecutarSeed = async (req, res) => {
  try {
    // Segunda capa de seguridad: una clave secreta que solo tú conoces
    const { seed_secret } = req.body;
    if (seed_secret !== process.env.SEED_SECRET) {
      return res.status(403).json({ error: 'Clave secreta para el seed incorrecta.' });
    }

    // --- Lógica copiada de tu archivo seed.js ---
    await sequelize.authenticate();

    const [plan] = await Plan.findOrCreate({
      where: { nombre: 'Plan Inicial' },
      defaults: {
        descripcion: 'Plan básico para pruebas',
        precioMensual: 0,
        maxSucursales: 10,
        maxUsuarios: 10
      }
    });

    const hashedPassword = await bcrypt.hash('admin123', 10);

    const [admin, created] = await Usuario.findOrCreate({
      where: { email: 'admin@gostinho.cl' },
      defaults: {
        nombre: 'Javier Admin',
        password: hashedPassword,
        rol: ROLES.ADMIN_SISTEMA,
        activo: true
      }
    });

    if (created) {
      return res.status(201).json({ mensaje: '✅ Usuario ADMIN_SISTEMA creado con éxito.' });
    } else {
      return res.status(200).json({ mensaje: 'ℹ️ El usuario administrador ya existía.' });
    }

  } catch (error) {
    console.error('❌ Error en el endpoint de seed:', error);
    return res.status(500).json({ error: 'Error interno al ejecutar el seed.' });
  }
};

module.exports = { ejecutarSeed };
