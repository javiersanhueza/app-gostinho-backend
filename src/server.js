require('dotenv').config();
const app = require('./app');
const sequelize = require('./config/db');

const PORT = process.env.PORT || 3000;

async function main() {
  try {
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida correctamente ✅');

    // Volvemos a alter: true para el funcionamiento normal.
    // Esto aplicará cambios futuros sin borrar los datos.
    await sequelize.sync({ alter: true });
    console.log('Tablas sincronizadas (modo no destructivo).');

    app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
  } catch (error) {
    console.error('Error fatal al conectar a la base de datos:', error);
    process.exit(1);
  }
}

main();
