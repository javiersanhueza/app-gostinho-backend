const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Empresa = require('./empresa.model');

const UnidadMedida = sequelize.define('UnidadMedida', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  abreviatura: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  empresa_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'empresas',
      key: 'id'
    }
  }
}, {
  tableName: 'unidades_medida',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

UnidadMedida.belongsTo(Empresa, { foreignKey: 'empresa_id', as: 'empresa' });
Empresa.hasMany(UnidadMedida, { foreignKey: 'empresa_id', as: 'unidades_medida' });

module.exports = UnidadMedida;
