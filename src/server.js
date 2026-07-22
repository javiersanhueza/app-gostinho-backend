require('dotenv').config();
const app = require('./app');
const sequelize = require('./config/db');

const PORT = process.env.PORT || 3000;

async function main() {
  try {
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida correctamente ✅');

    // La sincronización automática se deshabilita en producción para evitar errores.
    // Los cambios en la BD se harán manualmente o con migraciones.
    // await sequelize.sync(); 
    console.log('Sincronización de BD deshabilitada en producción. Servidor estable.');

    app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
  } catch (error) {
    console.error('Error fatal al conectar a la base de datos:', error);
    process.exit(1);
  }
}

main();
