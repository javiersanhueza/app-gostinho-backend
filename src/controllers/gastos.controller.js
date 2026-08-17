const { Op } = require('sequelize');
const Gasto = require('../models/gasto.model');
const CategoriaGasto = require('../models/categoria_gasto.model');
const ProductoGasto = require('../models/producto_gasto.model');
const UnidadMedida = require('../models/unidad_medida.model');
const Sucursal = require('../models/sucursal.model');

// --- GASTOS ---

const obtenerGastos = async (req, res) => {
  try {
    const { anio, mes, sucursal_id, categoria_id } = req.query;
    const empresa_id = req.usuario.empresa_id;
    const rol = req.usuario.rol;

    let whereClause = { empresa_id };

    // Si es ADMIN_SUCURSAL o CAJERO, forzar su propia sucursal
    if (rol === 'ADMIN_SUCURSAL' || rol === 'CAJERO' || rol === 'COCINERO') {
      whereClause.sucursal_id = req.usuario.sucursal_id;
    } else if (sucursal_id && sucursal_id !== 'todas') {
      // Si es ADMIN_EMPRESA y filtra por una sucursal específica
      if (sucursal_id === 'global') {
        whereClause.sucursal_id = null;
      } else {
        whereClause.sucursal_id = sucursal_id;
      }
    }

    // Filtro por categoría
    if (categoria_id && categoria_id !== 'todas') {
      whereClause.categoria_gasto_id = categoria_id;
    }

    // Filtro por fecha (Año y Mes)
    if (anio && mes) {
      const startOfMonth = new Date(anio, mes - 1, 1);
      const endOfMonth = new Date(anio, mes, 0, 23, 59, 59, 999);
      whereClause.fecha = {
        [Op.between]: [startOfMonth, endOfMonth]
      };
    }

    const gastos = await Gasto.findAll({
      where: whereClause,
      include: [
        { model: CategoriaGasto, as: 'categoria', attributes: ['id', 'nombre'] },
        { model: ProductoGasto, as: 'producto_gasto', attributes: ['id', 'nombre'] },
        { model: UnidadMedida, as: 'unidad', attributes: ['id', 'nombre', 'abreviatura'] },
        { model: Sucursal, as: 'sucursal', attributes: ['id', 'nombre'] }
      ],
      order: [['fecha', 'DESC'], ['created_at', 'DESC']]
    });

    res.json({ data: gastos });
  } catch (error) {
    res.status(500).json({ error: `Error al obtener gastos: ${error.message}` });
  }
};

const crearGastosBulk = async (req, res) => {
  try {
    const { gastos } = req.body;
    const empresa_id = req.usuario.empresa_id;
    const rol = req.usuario.rol;

    if (!Array.isArray(gastos) || gastos.length === 0) {
      return res.status(400).json({ error: 'Debe enviar un arreglo de gastos' });
    }

    // Inyectar empresa_id y sucursal_id forzado (si aplica)
    const gastosFormat = gastos.map(g => {
      let sucursal = g.sucursal_id;
      // Forzar sucursal si no es ADMIN_EMPRESA o ADMIN_SISTEMA
      if (rol !== 'ADMIN_EMPRESA' && rol !== 'ADMIN_SISTEMA') {
        sucursal = req.usuario.sucursal_id;
      }
      return {
        ...g,
        empresa_id,
        sucursal_id: sucursal || null
      };
    });

    const nuevosGastos = await Gasto.bulkCreate(gastosFormat);
    res.status(201).json({ data: nuevosGastos, mensaje: `${nuevosGastos.length} gastos registrados.` });
  } catch (error) {
    res.status(500).json({ error: `Error al registrar gastos: ${error.message}` });
  }
};

const borrarGasto = async (req, res) => {
  try {
    const { id } = req.params;
    const gasto = await Gasto.findOne({ where: { id, empresa_id: req.usuario.empresa_id } });
    if (!gasto) return res.status(404).json({ error: 'Gasto no encontrado' });

    // Regla: Solo ADMIN_EMPRESA puede borrar gastos, o el ADMIN_SUCURSAL si es de su sucursal
    if (req.usuario.rol === 'ADMIN_SUCURSAL' && gasto.sucursal_id !== req.usuario.sucursal_id) {
      return res.status(403).json({ error: 'No tienes permiso para borrar este gasto' });
    }

    await gasto.destroy();
    res.json({ mensaje: 'Gasto eliminado' });
  } catch (error) {
    res.status(500).json({ error: `Error al eliminar gasto: ${error.message}` });
  }
};

const actualizarGasto = async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha, categoria_gasto_id, producto_gasto_id, nombre_producto, cantidad, unidad_medida_id, monto_total, metodo_pago, tipo_recibo, observacion } = req.body;
    
    const gasto = await Gasto.findOne({ where: { id, empresa_id: req.usuario.empresa_id } });
    if (!gasto) return res.status(404).json({ error: 'Gasto no encontrado' });

    if (req.usuario.rol !== 'ADMIN_EMPRESA' && req.usuario.rol !== 'ADMIN_SISTEMA') {
      if (gasto.sucursal_id !== req.usuario.sucursal_id) {
        return res.status(403).json({ error: 'No tienes permiso para editar este gasto' });
      }
    }

    await gasto.update({
      fecha,
      categoria_gasto_id,
      producto_gasto_id,
      nombre_producto,
      cantidad,
      unidad_medida_id,
      monto_total,
      metodo_pago,
      tipo_recibo,
      observacion
    });

    res.json({ data: gasto, mensaje: 'Gasto actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ error: `Error al actualizar gasto: ${error.message}` });
  }
};


// --- CATEGORÍAS DE GASTO ---

const obtenerCategorias = async (req, res) => {
  try {
    const categorias = await CategoriaGasto.findAll({
      where: { empresa_id: req.usuario.empresa_id, activo: true },
      order: [['nombre', 'ASC']]
    });
    res.json({ data: categorias });
  } catch (error) {
    res.status(500).json({ error: `Error al obtener categorias: ${error.message}` });
  }
};

const crearCategoria = async (req, res) => {
  try {
    const { nombre } = req.body;
    
    const existente = await CategoriaGasto.findOne({
      where: {
        nombre: {
          [Op.iLike]: nombre.trim()
        },
        empresa_id: req.usuario.empresa_id
      }
    });

    if (existente) {
      return res.status(200).json({ data: existente, mensaje: 'La categoría ya existe' });
    }

    const nueva = await CategoriaGasto.create({ nombre: nombre.trim(), empresa_id: req.usuario.empresa_id });
    res.status(201).json({ data: nueva });
  } catch (error) {
    res.status(500).json({ error: `Error al crear categoria: ${error.message}` });
  }
};

const actualizarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;
    const categoria = await CategoriaGasto.findOne({ where: { id, empresa_id: req.usuario.empresa_id } });
    if (!categoria) return res.status(404).json({ error: 'Categoría no encontrada' });
    await categoria.update({ nombre });
    res.json({ data: categoria, mensaje: 'Categoría actualizada' });
  } catch (error) {
    res.status(500).json({ error: `Error al actualizar categoria: ${error.message}` });
  }
};

const borrarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const categoria = await CategoriaGasto.findOne({ where: { id, empresa_id: req.usuario.empresa_id } });
    if (!categoria) return res.status(404).json({ error: 'Categoría no encontrada' });
    
    // Check if there are associated expenses
    const gastos = await Gasto.count({ where: { categoria_gasto_id: id } });
    if (gastos > 0) {
      return res.status(400).json({ error: 'No se puede eliminar la categoría porque tiene gastos asociados' });
    }
    
    await categoria.destroy();
    res.json({ mensaje: 'Categoría eliminada' });
  } catch (error) {
    res.status(500).json({ error: `Error al eliminar categoria: ${error.message}` });
  }
};


// --- PRODUCTOS DE GASTO ---

const obtenerProductosGasto = async (req, res) => {
  try {
    const productos = await ProductoGasto.findAll({
      where: { empresa_id: req.usuario.empresa_id, activo: true },
      order: [['nombre', 'ASC']]
    });
    res.json({ data: productos });
  } catch (error) {
    res.status(500).json({ error: `Error al obtener productos: ${error.message}` });
  }
};

const crearProductoGasto = async (req, res) => {
  try {
    const { nombre, categoria_gasto_id } = req.body;
    if (!categoria_gasto_id) return res.status(400).json({ error: 'Falta categoria_gasto_id' });
    
    const existente = await ProductoGasto.findOne({
      where: {
        nombre: {
          [Op.iLike]: nombre.trim()
        },
        categoria_gasto_id,
        empresa_id: req.usuario.empresa_id
      }
    });

    if (existente) {
      return res.status(200).json({ data: existente, mensaje: 'El producto ya existe' });
    }

    const nuevo = await ProductoGasto.create({ nombre: nombre.trim(), categoria_gasto_id, empresa_id: req.usuario.empresa_id });
    res.status(201).json({ data: nuevo });
  } catch (error) {
    res.status(500).json({ error: `Error al crear producto: ${error.message}` });
  }
};

const actualizarProductoGasto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, categoria_gasto_id } = req.body;
    const producto = await ProductoGasto.findOne({ where: { id, empresa_id: req.usuario.empresa_id } });
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    await producto.update({ nombre, categoria_gasto_id });
    res.json({ data: producto, mensaje: 'Producto actualizado' });
  } catch (error) {
    res.status(500).json({ error: `Error al actualizar producto: ${error.message}` });
  }
};

const borrarProductoGasto = async (req, res) => {
  try {
    const { id } = req.params;
    const producto = await ProductoGasto.findOne({ where: { id, empresa_id: req.usuario.empresa_id } });
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

    // Check if there are associated expenses
    const gastos = await Gasto.count({ where: { producto_gasto_id: id } });
    if (gastos > 0) {
      return res.status(400).json({ error: 'No se puede eliminar el producto porque tiene gastos asociados' });
    }

    await producto.destroy();
    res.json({ mensaje: 'Producto eliminado' });
  } catch (error) {
    res.status(500).json({ error: `Error al eliminar producto: ${error.message}` });
  }
};


// --- UNIDADES DE MEDIDA ---

const obtenerUnidades = async (req, res) => {
  try {
    const unidades = await UnidadMedida.findAll({
      where: { empresa_id: req.usuario.empresa_id, activo: true },
      order: [['nombre', 'ASC']]
    });
    res.json({ data: unidades });
  } catch (error) {
    res.status(500).json({ error: `Error al obtener unidades: ${error.message}` });
  }
};

const crearUnidad = async (req, res) => {
  try {
    const { nombre, abreviatura } = req.body;
    const nueva = await UnidadMedida.create({ nombre, abreviatura, empresa_id: req.usuario.empresa_id });
    res.status(201).json({ data: nueva });
  } catch (error) {
    res.status(500).json({ error: `Error al crear unidad: ${error.message}` });
  }
};

module.exports = {
  obtenerGastos,
  crearGastosBulk,
  actualizarGasto,
  borrarGasto,
  obtenerCategorias,
  crearCategoria,
  actualizarCategoria,
  borrarCategoria,
  obtenerProductosGasto,
  crearProductoGasto,
  actualizarProductoGasto,
  borrarProductoGasto,
  obtenerUnidades,
  crearUnidad
};
