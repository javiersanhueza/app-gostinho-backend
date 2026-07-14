const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Producto = require('./producto.model');

const Variante = sequelize.define('Variante', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Ej: Normal, Familiar, Mediana, Litro'
  },
  precio: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  stock: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  // Reglas de negocio para los toppings y frutas
  max_sabores: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  max_frutas: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  max_toppings_gratis: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  max_toppings_pago: {
    type: DataTypes.INTEGER,
    defaultValue: 99 // Un número alto para no limitar por defecto
  },
  producto_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'productos',
      key: 'id'
    },
    onDelete: 'CASCADE'
  }
}, {
  tableName: 'variantes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Relaciones
Variante.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });
Producto.hasMany(Variante, { foreignKey: 'producto_id', as: 'variantes' });

module.exports = Variante;
