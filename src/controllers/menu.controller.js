const Producto = require('../models/producto.model');
const Categoria = require('../models/categoria.model');
const Variante = require('../models/variante.model');
const Sucursal = require('../models/sucursal.model');
const Empresa = require('../models/empresa.model');
const PromocionItem = require('../models/promocion_item.model');

const obtenerMenuPublico = async (req, res) => {
  try {
    const { slug } = req.params;

    // 1. Obtener la sucursal para saber a qué empresa pertenece
    const sucursal = await Sucursal.findOne({ 
      where: { slug: slug, activo: true },
      include: [{ model: Empresa, as: 'empresa', attributes: ['nombre', 'logo_url'] }]
    });
    
    
    if (!sucursal) {
      return res.status(404).json({ error: 'Sucursal no encontrada o inactiva' });
    }

    // 2. Obtener todas las categorías de la sucursal que tengan productos activos
    // Para facilitar la navegación (agrupado por categoría), buscaremos primero las categorías
    const categorias = await Categoria.findAll({
      where: { sucursal_id: sucursal.id },
      order: [['orden', 'ASC'], ['nombre', 'ASC']],
      include: [
        {
          model: Producto,
          as: 'productos',
          where: { activo: true },
          required: false, // LEFT JOIN para traer categorías aunque no tengan productos activos, pero luego filtraremos en el frontend o aquí
          include: [
            {
              model: Variante,
              as: 'variantes',
              where: { stock: true },
              required: false
            },
            {
              model: PromocionItem,
              as: 'promocion_items',
              include: [
                { model: Producto, as: 'producto_hijo', attributes: ['id', 'nombre', 'imagen'] },
                { model: Variante, as: 'variante_hija', attributes: ['id', 'nombre', 'precio'] }
              ]
            }
          ]
        }
      ]
    });

    // Filtramos las categorías que no tienen productos
    const categoriasConProductos = categorias.filter(c => c.productos && c.productos.length > 0);

    res.json({
      data: {
        sucursal: {
          id: sucursal.id,
          nombre: sucursal.nombre,
          direccion: sucursal.direccion
        },
        categorias: categoriasConProductos
      }
    });

  } catch (error) {
    console.error('Error al obtener menú público:', error);
    res.status(500).json({ error: 'Error al obtener el menú' });
  }
};

module.exports = {
  obtenerMenuPublico
};
