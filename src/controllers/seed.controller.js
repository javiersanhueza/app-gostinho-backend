const sequelize = require('../config/db');
const Plan = require('../models/plan.model');
const Empresa = require('../models/empresa.model');
const Sucursal = require('../models/sucursal.model');
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

    await sequelize.authenticate();

    // 1. Crear Roles
    const rolesACrear = Object.values(ROLES).map(rol => ({ nombre: rol }));
    await Rol.bulkCreate(rolesACrear, { ignoreDuplicates: true });

    // 2. Crear Plan
    const [planInicial] = await Plan.findOrCreate({
      where: { nombre: 'Plan Inicial' },
      defaults: {
        descripcion: 'Plan básico para pruebas',
        precioMensual: 0,
        maxSucursales: 10,
        maxUsuarios: 10
      }
    });

    // 3. Crear Empresa de prueba
    const [empresaTest] = await Empresa.findOrCreate({
        where: { nombre: 'Gostinho Corp' },
        defaults: {
            rut: '77.777.777-7',
            plan_id: planInicial.id
        }
    });

    // 4. Crear Sucursal de prueba
    await Sucursal.findOrCreate({
        where: { nombre: 'Local Principal', empresa_id: empresaTest.id },
        defaults: {
            direccion: 'Av. Siempre Viva 123'
        }
    });

    // 5. Crear Usuario Administrador del Sistema
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const [admin, created] = await Usuario.findOrCreate({
      where: { email: 'admin@gostinho.cl' },
      defaults: {
        nombre: 'Javier Admin',
        password: hashedPassword,
        activo: true
      }
    });

    // 6. Asignar Rol de ADMIN_SISTEMA
    if (created) {
      const rolAdminSistema = await Rol.findOne({ where: { nombre: ROLES.ADMIN_SISTEMA } });
      if (rolAdminSistema) {
        await admin.addRol(rolAdminSistema);
      }
    }
    
    res.status(200).json({ mensaje: '✅ Seed ejecutado: Roles, Plan, Empresa y Sucursal de prueba creados o verificados.' });

  } catch (error) {
    console.error('❌ Error en el endpoint de seed:', error);
    return res.status(500).json({ error: 'Error interno al ejecutar el seed.' });
  }
};

module.exports = { ejecutarSeed };
