const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Empresa = require('./empresa.model');

const Sucursal = sequelize.define('Sucursal', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  direccion: {
    type: DataTypes.STRING(255),
    allowNull: true
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
    },
    onDelete: 'CASCADE' // Si borras la empresa, se borran sus sucursales
  }
}, {
  tableName: 'sucursales',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Definición de Relación
Sucursal.belongsTo(Empresa, { foreignKey: 'empresa_id', as: 'empresa' });
Empresa.hasMany(Sucursal, { foreignKey: 'empresa_id', as: 'sucursales' });

module.exports = Sucursal;
