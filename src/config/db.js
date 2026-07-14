const { Sequelize } = require('sequelize');

// Configuración para MySQL
const sequelize = new Sequelize(
    process.env.DB_NAME || 'gostinho_saas',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'mysql',
        logging: false,
        // Opciones específicas para producción en la nube
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false // Esta opción puede ser necesaria en algunos proveedores de nube
            }
        }
    }
);

// Solo aplicar SSL en producción (cuando DB_HOST no sea localhost)
if (process.env.DB_HOST && process.env.DB_HOST !== 'localhost') {
    // La configuración ya está aplicada arriba, esto es solo una confirmación lógica.
    // En futuras versiones, podríamos hacer la configuración condicional aquí.
} else {
    // Para desarrollo local, no necesitamos SSL
    delete sequelize.options.dialectOptions;
}


module.exports = sequelize;
