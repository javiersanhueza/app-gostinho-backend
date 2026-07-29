require('dotenv').config();
const { Sequelize } = require('sequelize');
const sequelize = require('./src/config/db');

const migrate = async () => {
  try {
    // 1. Agregar columna si no existe
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='sucursales' AND column_name='slug';
    `);

    if (results.length === 0) {
      console.log('Agregando columna slug...');
      await sequelize.query('ALTER TABLE sucursales ADD COLUMN slug VARCHAR(255) UNIQUE;');
    } else {
      console.log('La columna slug ya existe.');
    }

    // 2. Generar slugs para los registros existentes
    const [sucursales] = await sequelize.query('SELECT id, nombre, slug FROM sucursales WHERE slug IS NULL;');
    
    for (const sucursal of sucursales) {
      let baseSlug = sucursal.nombre.toLowerCase().trim()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // quitar acentos
        .replace(/[^a-z0-9]+/g, '-') // reemplazar caracteres especiales y espacios por guiones
        .replace(/^-+|-+$/g, ''); // quitar guiones iniciales o finales

      // Manejar colisiones agregando un número aleatorio corto
      const suffix = Math.random().toString(36).substring(2, 6);
      const slug = `${baseSlug}-${suffix}`;
      
      await sequelize.query('UPDATE sucursales SET slug = ? WHERE id = ?', {
        replacements: [slug, sucursal.id]
      });
      console.log(`Sucursal ${sucursal.id} actualizada con slug: ${slug}`);
    }

    console.log('Migración completada con éxito.');
  } catch (error) {
    console.error('Error en migración:', error);
  } finally {
    process.exit();
  }
};

migrate();
