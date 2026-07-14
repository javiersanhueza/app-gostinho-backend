const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Empresa = require('./empresa.model');
const Sucursal = require('./sucursal.model');

const Comanda = sequelize.define('Comanda', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  numero_mesa: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  estado: {
    type: DataTypes.STRING(50),
    defaultValue: 'ABIERTA', // ABIERTA, CERRADA, PAGADA
    allowNull: false
  },
  total_acumulado: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  empresa_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'empresas',
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
  tableName: 'comandas',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      // No puede haber dos mesas con el mismo número abiertas en la misma sucursal
      unique: true,
      fields: ['numero_mesa', 'sucursal_id'],
      where: {
        estado: 'ABIERTA'
      }
    }
  ]
});

// Relaciones
Comanda.belongsTo(Empresa, { foreignKey: 'empresa_id', as: 'empresa' });
Empresa.hasMany(Comanda, { foreignKey: 'empresa_id', as: 'comandas' });

Comanda.belongsTo(Sucursal, { foreignKey: 'sucursal_id', as: 'sucursal' });
Sucursal.hasMany(Comanda, { foreignKey: 'sucursal_id', as: 'comandas' });

module.exports = Comanda;
