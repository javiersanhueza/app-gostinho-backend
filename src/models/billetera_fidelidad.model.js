const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Cliente = require('./cliente.model');
const Empresa = require('./empresa.model');

const BilleteraFidelidad = sequelize.define('BilleteraFidelidad', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  cliente_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'clientes',
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
  },
  puntos: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  sellos: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  }
}, {
  tableName: 'billeteras_fidelidad',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['cliente_id', 'empresa_id']
    }
  ]
});

// Asociaciones
BilleteraFidelidad.belongsTo(Cliente, { foreignKey: 'cliente_id', as: 'cliente' });
Cliente.hasMany(BilleteraFidelidad, { foreignKey: 'cliente_id', as: 'billeteras' });

BilleteraFidelidad.belongsTo(Empresa, { foreignKey: 'empresa_id', as: 'empresa' });
Empresa.hasMany(BilleteraFidelidad, { foreignKey: 'empresa_id', as: 'billeteras' });

module.exports = BilleteraFidelidad;
