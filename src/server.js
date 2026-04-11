require('dotenv').config();
const app = require('./app');

// 1. Importa la conexión
const prisma = require('./config/db');
const PORT = process.env.PORT || 3000;

async function main() {
  try {

    // 2. Se intenta conectar a la base de datos
    await prisma.$connect();
    console.log('Base de datos (supabase) conectada correctamente');

    // 3. Inicia el servidor
    app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
  } catch (error) {
    // 4. Si falla la db, mostrar error y se detiene el proceso
    console.error('Error fatal al conectar a la base de datos:', error);
    process.exit(1);
  }
}

main();
