const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Empresa = require('./empresa.model');
const Categoria = require('./categoria.model');

const Producto = sequelize.define('Producto', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  imagen: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  es_combo: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  opcion_endulzante: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  categoria_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'categorias',
      key: 'id'
    }
  },
  sucursal_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'sucursales',
      key: 'id'
    }
  }
}, {
  tableName: 'productos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

const Sucursal = require('./sucursal.model');

// Relaciones
Producto.belongsTo(Sucursal, { foreignKey: 'sucursal_id', as: 'sucursal' });
Sucursal.hasMany(Producto, { foreignKey: 'sucursal_id', as: 'productos' });

Producto.belongsTo(Categoria, { foreignKey: 'categoria_id', as: 'categoria' });
Categoria.hasMany(Producto, { foreignKey: 'categoria_id', as: 'productos' });

module.exports = Producto;
