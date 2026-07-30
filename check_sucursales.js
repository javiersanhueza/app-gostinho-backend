require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false
});

async function run() {
  try {
    await sequelize.authenticate();
    const [results] = await sequelize.query("SELECT id, nombre, slug, activo FROM sucursales");
    console.log("Sucursales:", results);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
run();
