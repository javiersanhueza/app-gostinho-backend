require('dotenv').config();
const app = require('./app');
const sequelize = require('./config/db');

const PORT = process.env.PORT || 3000;

async function main() {
  try {
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida correctamente ✅');

    // FORZAMOS LA RE-CREACIÓN DE TABLAS para aplicar el nuevo sistema de ROLES.
    // Esto borrará todos los datos actuales.
    await sequelize.sync({ force: true });
    console.log('Tablas RE-CREADAS desde cero para el nuevo sistema de roles. ✅');

    app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
  } catch (error) {
    console.error('Error fatal al conectar a la base de datos:', error);
    process.exit(1);
  }
}

main();
