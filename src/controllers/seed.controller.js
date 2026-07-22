const sequelize = require('../config/db');
const Plan = require('../models/plan.model');
const Usuario = require('../models/usuario.model');
const Rol = require('../models/rol.model');
const bcrypt = require('bcryptjs');
const ROLES = require('../config/roles');

const ejecutarSeed = async (req, res) => {
  try {
    const { seed_secret } = req.body;
    if (seed_secret !== process.env.SEED_SECRET) {
      return res.status(403).json({ error: 'Clave secreta para el seed incorrecta.' });
    }

    // --- Lógica de Seed Actualizada ---
    await sequelize.authenticate();

    // 1. Crear todos los roles en la tabla Roles si no existen
    const rolesACrear = Object.values(ROLES).map(rol => ({ nombre: rol }));
    await Rol.bulkCreate(rolesACrear, { ignoreDuplicates: true });
    console.log('Roles maestros creados o verificados.');

    // 2. Crear plan por defecto
    await Plan.findOrCreate({
      where: { nombre: 'Plan Inicial' },
      defaults: {
        descripcion: 'Plan básico para pruebas',
        precioMensual: 0,
        maxSucursales: 10,
        maxUsuarios: 10
      }
    });

    // 3. Crear el usuario administrador
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const [admin, created] = await Usuario.findOrCreate({
      where: { email: 'admin@gostinho.cl' },
      defaults: {
        nombre: 'Javier Admin',
        password: hashedPassword,
        activo: true
      }
    });

    // 4. Asignar el rol de ADMIN_SISTEMA al usuario
    if (created) {
      const rolAdminSistema = await Rol.findOne({ where: { nombre: ROLES.ADMIN_SISTEMA } });
      if (rolAdminSistema) {
        await admin.addRol(rolAdminSistema);
        return res.status(201).json({ mensaje: '✅ Usuario ADMIN_SISTEMA creado y rol asignado con éxito.' });
      }
    }
    
    return res.status(200).json({ mensaje: 'ℹ️ El usuario administrador ya existía.' });

  } catch (error) {
    console.error('❌ Error en el endpoint de seed:', error);
    return res.status(500).json({ error: 'Error interno al ejecutar el seed.' });
  }
};

module.exports = { ejecutarSeed };
