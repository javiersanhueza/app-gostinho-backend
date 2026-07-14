require('dotenv').config();
const app = require('./app');
const sequelize = require('./config/db');

const PORT = process.env.PORT || 3000;

async function main() {
  try {
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida correctamente ✅');

    // Usamos force: true UNA SOLA VEZ para limpiar la base de datos en la nube.
    // Esto borrará todas las tablas y las recreará desde cero.
    await sequelize.sync({ force: true });
    console.log('Tablas RE-CREADAS desde cero. ✅');

    app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
  } catch (error) {
    console.error('Error fatal al conectar a la base de datos:', error);
    process.exit(1);
  }
}

main();
