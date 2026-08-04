const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Empresa = require('./empresa.model');
const CategoriaGasto = require('./categoria_gasto.model');

const ProductoGasto = sequelize.define('ProductoGasto', {
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
  categoria_gasto_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'categorias_gasto',
      key: 'id'
    }
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
  tableName: 'productos_gasto',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

ProductoGasto.belongsTo(CategoriaGasto, { foreignKey: 'categoria_gasto_id', as: 'categoria_gasto' });
CategoriaGasto.hasMany(ProductoGasto, { foreignKey: 'categoria_gasto_id', as: 'productos_gasto' });

ProductoGasto.belongsTo(Empresa, { foreignKey: 'empresa_id', as: 'empresa' });
Empresa.hasMany(ProductoGasto, { foreignKey: 'empresa_id', as: 'productos_gasto' });

module.exports = ProductoGasto;
