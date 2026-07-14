const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Orden = require('./orden.model');
const Producto = require('./producto.model');

const OrdenDetalle = sequelize.define('OrdenDetalle', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  precio_unitario: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  subtotal: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  // Para guardar extras como "sin cebolla", "extra queso" en la orden específica
  opciones_elegidas: {
    type: DataTypes.JSON,
    allowNull: true
  },
  orden_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'ordenes',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  // Producto histórico. ¿Qué pasa si borran el producto? Se pone SET NULL pero mantenemos el nombre histórico.
  producto_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'productos',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  nombre_producto_historico: {
    type: DataTypes.STRING(255),
    allowNull: false,
    description: "Guardamos el nombre del producto al momento de la compra por si después le cambian el nombre o lo borran"
  }
}, {
  tableName: 'orden_detalles',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Relaciones
OrdenDetalle.belongsTo(Orden, { foreignKey: 'orden_id', as: 'orden' });
Orden.hasMany(OrdenDetalle, { foreignKey: 'orden_id', as: 'detalles' });

OrdenDetalle.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });
Producto.hasMany(OrdenDetalle, { foreignKey: 'producto_id', as: 'detalles_orden' });

module.exports = OrdenDetalle;
