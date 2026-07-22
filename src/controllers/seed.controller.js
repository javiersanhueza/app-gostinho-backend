const sequelize = require('../config/db');
const Plan = require('../models/plan.model');
const Empresa = require('../models/empresa.model');
const Sucursal = require('../models/sucursal.model');
const Usuario = require('../models/usuario.model');
const Rol = require('../models/rol.model');
const bcrypt = require('bcryptjs');
const ROLES = require('../config/roles');

const ejecutarSeed = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { seed_secret } = req.body;
    if (seed_secret !== process.env.SEED_SECRET) {
      return res.status(403).json({ error: 'Clave secreta para el seed incorrecta.' });
    }

    // 1. Crear Roles
    const rolesACrear = Object.values(ROLES).map(rol => ({ nombre: rol }));
    await Rol.bulkCreate(rolesACrear, { ignoreDuplicates: true, transaction: t });

    // 2. Crear Plan
    const [planInicial] = await Plan.findOrCreate({
      where: { nombre: 'Plan Inicial' },
      defaults: {
        descripcion: 'Plan básico para pruebas',
        precioMensual: 0,
        maxSucursales: 10,
        maxUsuarios: 10
      },
      transaction: t
    });

    // 3. Crear Empresa de prueba
    const [empresaTest] = await Empresa.findOrCreate({
        where: { nombre: 'Gostinho Corp' },
        defaults: {
            rut: '77.777.777-7',
            plan_id: planInicial.id
        },
        transaction: t
    });

    // 4. Crear Sucursal de prueba
    await Sucursal.findOrCreate({
        where: { nombre: 'Local Principal', empresa_id: empresaTest.id },
        defaults: {
            direccion: 'Av. Siempre Viva 123'
        },
        transaction: t
    });

    // 5. Crear Usuario Administrador del Sistema
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const [admin, created] = await Usuario.findOrCreate({
      where: { email: 'admin@gostinho.cl' },
      defaults: {
        nombre: 'Javier Admin',
        password: hashedPassword,
        activo: true
      },
      transaction: t
    });

    // 6. Asignar Rol de ADMIN_SISTEMA
    const rolAdminSistema = await Rol.findOne({ where: { nombre: ROLES.ADMIN_SISTEMA }, transaction: t });
    if (rolAdminSistema) {
      // setRoles reemplaza todos los roles. Usamos addRol para asegurar que lo tenga.
      // Para un seed limpio, setRoles es seguro.
      await admin.setRoles([rolAdminSistema], { transaction: t });
    } else {
      // Esto no debería pasar si el paso 1 funciona
      throw new Error('El rol ADMIN_SISTEMA no se pudo encontrar o crear.');
    }
    
    await t.commit();
    res.status(200).json({ mensaje: '✅ Seed ejecutado: Roles, Plan, Empresa y Sucursal de prueba creados o verificados.' });

  } catch (error) {
    await t.rollback();
    console.error('❌ Error en el endpoint de seed:', error);
    return res.status(500).json({ error: 'Error interno al ejecutar el seed.' });
  }
};

module.exports = { ejecutarSeed };
