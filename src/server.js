require('dotenv').config();
const app = require('./app');
const sequelize = require('./config/db');

const PORT = process.env.PORT || 3000;

async function main() {
  try {
    await sequelize.authenticate();
    console.log('Conexión a MySQL local establecida correctamente ✅');

    // Volvemos a alter: true o simplemente sync() una vez que la DB fue limpiada.
    await sequelize.sync();
    console.log('Tablas sincronizadas automáticamente 🔄');

    app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
  } catch (error) {
    console.error('Error fatal al conectar a MySQL:', error);
    process.exit(1);
  }
}

main();