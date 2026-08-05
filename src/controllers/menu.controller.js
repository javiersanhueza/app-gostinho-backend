const logger = require('../utils/logger');
const Producto = require('../models/producto.model');
const Categoria = require('../models/categoria.model');
const Variante = require('../models/variante.model');
const Sucursal = require('../models/sucursal.model');
const Empresa = require('../models/empresa.model');
const PromocionItem = require('../models/promocion_item.model');
const Descuento = require('../models/descuento.model');
const { Op } = require('sequelize');

const obtenerMenuPublico = async (req, res) => {
  try {
    const { slug } = req.params;

    // 1. Obtener la sucursal para saber a qué empresa pertenece
    const sucursal = await Sucursal.findOne({ 
      where: { slug: slug, activo: true },
      include: [{ model: Empresa, as: 'empresa', attributes: ['id', 'nombre', 'logo_url'] }]
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

    // 3. Obtener descuentos activos aplicables a esta sucursal
    const currentDate = new Date();
    const descuentosActivos = await Descuento.findAll({
      where: {
        empresa_id: sucursal.empresa.id,
        activo: true,
        fecha_inicio: { [Op.lte]: currentDate },
        fecha_fin: { [Op.gte]: currentDate },
        [Op.or]: [
          { sucursal_id: sucursal.id },
          { aplica_todas_sucursales: true }
        ]
      },
      include: [{
        model: Producto,
        as: 'productos',
        attributes: ['id'],
        through: { attributes: [] }
      }]
    });

    // 4. Calcular el descuento máximo para cada producto y adjuntarlo
    categoriasConProductos.forEach(categoria => {
      categoria.productos.forEach(producto => {
        let maxPorcentaje = 0;
        let nombreDescuento = '';

        descuentosActivos.forEach(desc => {
          let aplica = false;
          if (desc.aplica_a_todo) {
            aplica = true;
          } else if (desc.productos && desc.productos.some(p => p.id === producto.id)) {
            aplica = true;
          }

          if (aplica && desc.porcentaje > maxPorcentaje) {
            maxPorcentaje = desc.porcentaje;
            nombreDescuento = desc.nombre;
          }
        });

        if (maxPorcentaje > 0) {
          producto.setDataValue('descuento_activo', { porcentaje: maxPorcentaje, nombre: nombreDescuento });
        }
      });
    });

    res.json({
      data: {
        sucursal: {
          id: sucursal.id,
          nombre: sucursal.nombre,
          direccion: sucursal.direccion,
          empresa: sucursal.empresa
        },
        categorias: categoriasConProductos,
        promociones: descuentosActivos.map(d => ({
          nombre: d.nombre,
          porcentaje: d.porcentaje,
          fecha_fin: d.fecha_fin,
          aplica_a_todo: d.aplica_a_todo
        }))
      }
    });

  } catch (error) {
    logger.error('Error al obtener menú público:', error);
    res.status(500).json({ error: 'Error al obtener el menú' });
  }
};

module.exports = {
  obtenerMenuPublico
};
