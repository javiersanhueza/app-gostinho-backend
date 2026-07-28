const Producto = require('./src/models/producto.model');
const PromocionItem = require('./src/models/promocion_item.model');

async function syncDb() {
  try {
    await Producto.sync({ alter: true });
    console.log('Producto table synced successfully.');
    await PromocionItem.sync({ alter: true });
    console.log('PromocionItem table synced successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error syncing:', err);
    process.exit(1);
  }
}

syncDb();
