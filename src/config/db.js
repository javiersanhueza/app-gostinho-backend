const { Sequelize } = require('sequelize');
require('dotenv').config(); // Asegurarse de que las variables de .env se carguen

let sequelize;

// La variable DATABASE_URL es la que usan proveedores como Neon, Heroku, etc.
// Le damos prioridad máxima.
if (process.env.DATABASE_URL) {
    // Conexión para Producción (PostgreSQL en Neon)
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        protocol: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false // Necesario para conectar a Neon, Render, etc.
            }
        },
        logging: false
    });
} else {
    // Conexión para Desarrollo Local (MySQL)
    sequelize = new Sequelize(
        process.env.DB_NAME || 'gostinho_saas',
        process.env.DB_USER || 'root',
        process.env.DB_PASSWORD || '',
        {
            host: process.env.DB_HOST || 'localhost',
            dialect: 'mysql',
            logging: false
        }
    );
}

module.exports = sequelize;
