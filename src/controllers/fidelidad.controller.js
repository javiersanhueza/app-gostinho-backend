const FidelidadConfig = require('../models/fidelidad_config.model');
const logger = require('../utils/logger');

// Obtener la configuración actual de la empresa
const obtenerConfig = async (req, res) => {
  try {
    const empresa_id = req.usuario.empresa_id;
    let config = await FidelidadConfig.findOne({ where: { empresa_id } });

    // Si no existe, crear la de por defecto
    if (!config) {
      config = await FidelidadConfig.create({ empresa_id });
    }

    res.status(200).json(config);
  } catch (error) {
    logger.error('Error al obtener configuración de fidelidad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Actualizar configuración
const actualizarConfig = async (req, res) => {
  try {
    const empresa_id = req.usuario.empresa_id;
    const { tipo_programa, puntos_porcentaje, puntos_monto_minimo, sellos_meta, sellos_monto_minimo, premio_producto_id } = req.body;

    let config = await FidelidadConfig.findOne({ where: { empresa_id } });
    if (!config) {
      config = await FidelidadConfig.create({
        empresa_id,
        tipo_programa,
        puntos_porcentaje,
        puntos_monto_minimo,
        sellos_meta,
        sellos_monto_minimo,
        premio_producto_id
      });
    } else {
      await config.update({
        tipo_programa,
        puntos_porcentaje,
        puntos_monto_minimo,
        sellos_meta,
        sellos_monto_minimo,
        premio_producto_id
      });
    }

    res.status(200).json({ mensaje: 'Configuración actualizada', config });
  } catch (error) {
    logger.error('Error al actualizar configuración de fidelidad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { obtenerConfig, actualizarConfig };
