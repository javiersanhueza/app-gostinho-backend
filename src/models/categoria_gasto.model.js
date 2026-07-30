const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Empresa = require('./empresa.model');

const CategoriaGasto = sequelize.define('CategoriaGasto', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nombre: {
    type: DataTypes.STRING(255),
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
  tableName: 'categorias_gasto',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

CategoriaGasto.belongsTo(Empresa, { foreignKey: 'empresa_id', as: 'empresa' });
Empresa.hasMany(CategoriaGasto, { foreignKey: 'empresa_id', as: 'categorias_gasto' });

module.exports = CategoriaGasto;
