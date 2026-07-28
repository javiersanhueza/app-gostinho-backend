const Endulzante = require('./src/models/endulzante.model');

async function syncDb() {
  try {
    await Endulzante.sync({ alter: true });
    console.log('Endulzante table synced successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error syncing Endulzante:', err);
    process.exit(1);
  }
}

syncDb();
