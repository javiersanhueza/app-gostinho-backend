const { Op } = require('sequelize');
const Gasto = require('../models/gasto.model');
const CategoriaGasto = require('../models/categoria_gasto.model');
const UnidadMedida = require('../models/unidad_medida.model');
const Sucursal = require('../models/sucursal.model');

// --- GASTOS ---

const obtenerGastos = async (req, res) => {
  try {
    const { anio, mes, sucursal_id } = req.query;
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
    const { fecha, categoria_gasto_id, nombre_producto, cantidad, unidad_medida_id, monto_total, metodo_pago, tipo_recibo } = req.body;
    
    const gasto = await Gasto.findOne({ where: { id, empresa_id: req.usuario.empresa_id } });
    if (!gasto) return res.status(404).json({ error: 'Gasto no encontrado' });

    // Regla: Solo ADMIN_EMPRESA puede borrar/editar cualquier gasto. 
    // CAJERO/ADMIN_SUCURSAL solo pueden editar gastos de su sucursal.
    if (req.usuario.rol !== 'ADMIN_EMPRESA' && req.usuario.rol !== 'ADMIN_SISTEMA') {
      if (gasto.sucursal_id !== req.usuario.sucursal_id) {
        return res.status(403).json({ error: 'No tienes permiso para editar este gasto' });
      }
    }

    await gasto.update({
      fecha,
      categoria_gasto_id,
      nombre_producto,
      cantidad,
      unidad_medida_id,
      monto_total,
      metodo_pago,
      tipo_recibo
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
    const nueva = await CategoriaGasto.create({ nombre, empresa_id: req.usuario.empresa_id });
    res.status(201).json({ data: nueva });
  } catch (error) {
    res.status(500).json({ error: `Error al crear categoria: ${error.message}` });
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
  obtenerUnidades,
  crearUnidad
};
