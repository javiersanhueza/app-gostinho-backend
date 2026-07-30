const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Empresa = require('./empresa.model');

const Categoria = sequelize.define('Categoria', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  orden: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  },
  activa: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
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
  tableName: 'categorias',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

const Sucursal = require('./sucursal.model');

// Relaciones
Categoria.belongsTo(Sucursal, { foreignKey: 'sucursal_id', as: 'sucursal' });
Sucursal.hasMany(Categoria, { foreignKey: 'sucursal_id', as: 'categorias' });

module.exports = Categoria;
