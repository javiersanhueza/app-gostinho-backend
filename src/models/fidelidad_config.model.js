const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Empresa = require('./empresa.model');

const FidelidadConfig = sequelize.define('FidelidadConfig', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  empresa_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true, // Una configuración por empresa
    references: {
      model: 'empresas',
      key: 'id'
    }
  },
  tipo_programa: {
    type: DataTypes.ENUM('PUNTOS', 'SELLOS', 'AMBOS'),
    defaultValue: 'PUNTOS',
    allowNull: false
  },
  puntos_porcentaje: {
    type: DataTypes.FLOAT,
    defaultValue: 2.0, // 2% por defecto
    allowNull: false
  },
  puntos_monto_minimo: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  sellos_meta: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
    allowNull: false
  },
  sellos_monto_minimo: {
    type: DataTypes.INTEGER,
    defaultValue: 5000,
    allowNull: false
  },
  premio_producto_id: {
    type: DataTypes.UUID,
    allowNull: true // Puede ser null si aún no han configurado premio
  },
  premio_variante_id: {
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  tableName: 'fidelidad_configs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Asociaciones
FidelidadConfig.belongsTo(Empresa, { foreignKey: 'empresa_id', as: 'empresa' });
Empresa.hasOne(FidelidadConfig, { foreignKey: 'empresa_id', as: 'fidelidad_config' });

module.exports = FidelidadConfig;
