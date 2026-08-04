const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Empresa = require('./empresa.model');
const Sucursal = require('./sucursal.model');

const Descuento = sequelize.define('Descuento', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  porcentaje: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 100
    }
  },
  fecha_inicio: {
    type: DataTypes.DATE,
    allowNull: false
  },
  fecha_fin: {
    type: DataTypes.DATE,
    allowNull: false
  },
  aplica_a_todo: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  aplica_todas_sucursales: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Interruptor manual para pausar el descuento antes de la fecha_fin'
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
    allowNull: true,
    references: {
      model: 'sucursales',
      key: 'id'
    }
  }
}, {
  tableName: 'descuentos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

const Producto = require('./producto.model');

Descuento.belongsTo(Empresa, { foreignKey: 'empresa_id', as: 'empresa' });
Empresa.hasMany(Descuento, { foreignKey: 'empresa_id', as: 'descuentos' });

Descuento.belongsTo(Sucursal, { foreignKey: 'sucursal_id', as: 'sucursal' });
Sucursal.hasMany(Descuento, { foreignKey: 'sucursal_id', as: 'descuentos' });

Descuento.belongsToMany(Producto, { through: 'descuentos_productos', as: 'productos', foreignKey: 'descuento_id' });
Producto.belongsToMany(Descuento, { through: 'descuentos_productos', as: 'descuentos', foreignKey: 'producto_id' });

module.exports = Descuento;
