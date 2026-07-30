const sequelize = require('./src/config/db');

async function addLogoUrl() {
  try {
    await sequelize.authenticate();
    console.log('Conexión a BD OK.');
    
    // Add column if it doesn't exist
    await sequelize.query('ALTER TABLE empresas ADD COLUMN IF NOT EXISTS logo_url VARCHAR(255);');
    console.log('Columna logo_url añadida exitosamente.');
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

addLogoUrl();
