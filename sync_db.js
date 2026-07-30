require('dotenv').config();
const sequelize = require('./src/config/db');
require('./src/models/producto.model');
require('./src/models/variante.model');
// Cargar todos los modelos si es necesario, pero sync con alter: true actualizará lo que encuentre.

async function main() {
  try {
    await sequelize.authenticate();
    console.log('Conectado. Ejecutando sync alter...');
    await sequelize.sync({ alter: true });
    console.log('Base de datos sincronizada correctamente.');
    process.exit(0);
  } catch (error) {
    console.error('Error al sincronizar:', error);
    process.exit(1);
  }
}
main();
