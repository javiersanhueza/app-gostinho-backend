const { Sequelize } = require('sequelize');

// Configuración para MySQL Local
const sequelize = new Sequelize(
    process.env.DB_NAME || 'gostinho_saas',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'mysql',
        logging: false,
    }
);

module.exports = sequelize;
