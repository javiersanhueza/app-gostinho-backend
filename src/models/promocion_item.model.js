const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Producto = require('./producto.model');
const Variante = require('./variante.model');

const PromocionItem = sequelize.define('PromocionItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  cantidad: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    allowNull: false
  },
  producto_padre_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'productos',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  producto_hijo_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'productos',
      key: 'id'
    }
  },
  variante_hijo_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'variantes',
      key: 'id'
    }
  }
}, {
  tableName: 'promocion_items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Relaciones
// Un PromocionItem pertenece a un ProductoPadre (El Combo)
PromocionItem.belongsTo(Producto, { foreignKey: 'producto_padre_id', as: 'padre' });
Producto.hasMany(PromocionItem, { foreignKey: 'producto_padre_id', as: 'promocion_items' });

// Un PromocionItem referencia a un ProductoHijo (El producto que se entrega)
PromocionItem.belongsTo(Producto, { foreignKey: 'producto_hijo_id', as: 'producto_hijo' });

// Un PromocionItem puede referenciar a una Variante específica del ProductoHijo
PromocionItem.belongsTo(Variante, { foreignKey: 'variante_hijo_id', as: 'variante_hija' });

module.exports = PromocionItem;
