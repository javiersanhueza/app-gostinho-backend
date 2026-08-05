require('dotenv').config();
const app = require('./app');
const sequelize = require('./config/db');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3000;

async function main() {
  try {
    await sequelize.authenticate();
    logger.info('Conexión a la base de datos establecida correctamente ✅');

    // La sincronización automática se deshabilita en producción para evitar errores.
    // Los cambios en la BD se harán manualmente o con migraciones.
    // await sequelize.sync(); 
    logger.info('Sincronización de BD deshabilitada en producción. Servidor estable.');

    app.listen(PORT, () => logger.info(`Servidor corriendo en el puerto ${PORT}`));
  } catch (error) {
    logger.error('Error fatal al conectar a la base de datos:', error);
    process.exit(1);
  }
}

main();
