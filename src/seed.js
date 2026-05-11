require('dotenv').config();
const sequelize = require('./config/db');
const Plan = require('./models/plan.model');
const Usuario = require('./models/usuario.model');
const bcrypt = require('bcryptjs');
const ROLES = require('./config/roles');

async function seed() {
  try {
    // 1. Conectar y sincronizar (sin borrar nada)
    await sequelize.authenticate();

    // 2. Crear un plan por defecto (lo necesita la tabla Empresa después)
    const [plan] = await Plan.findOrCreate({
      where: { nombre: 'Plan Inicial' },
      defaults: {
        descripcion: 'Plan básico para pruebas',
        precioMensual: 0,
        maxSucursales: 10,
        maxUsuarios: 10
      }
    });

    // 3. Encriptar contraseña para el Admin
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // 4. Crear el ADMIN_SISTEMA
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
      console.log('✅ Usuario ADMIN_SISTEMA creado con éxito.');
      console.log('📧 Email: admin@gostinho.cl');
      console.log('🔑 Pass: admin123');
    } else {
      console.log('ℹ️ El usuario ya existía.');
    }

  } catch (error) {
    console.error('❌ Error en el seed:', error);
  } finally {
    await sequelize.close();
  }
}

seed();
