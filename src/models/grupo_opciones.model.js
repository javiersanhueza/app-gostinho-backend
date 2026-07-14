const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Producto = require('./producto.model');
const Sabor = require('./sabor.model');
const Fruta = require('./fruta.model');
const Topping = require('./topping.model');

const GrupoOpciones = sequelize.define('GrupoOpciones', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Ej: Elige tu base, Agrega frutas'
  },
  tipo_seleccion: {
    type: DataTypes.STRING(50),
    defaultValue: 'MULTIPLE', // UNICO, MULTIPLE
    allowNull: false
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
  tableName: 'grupo_opciones',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Relaciones
GrupoOpciones.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });
Producto.hasMany(GrupoOpciones, { foreignKey: 'producto_id', as: 'grupos_opciones' });

// Relaciones Many-to-Many con los items
GrupoOpciones.belongsToMany(Sabor, { through: 'GrupoOpciones_Sabores', as: 'sabores' });
Sabor.belongsToMany(GrupoOpciones, { through: 'GrupoOpciones_Sabores', as: 'grupos' });

GrupoOpciones.belongsToMany(Fruta, { through: 'GrupoOpciones_Frutas', as: 'frutas' });
Fruta.belongsToMany(GrupoOpciones, { through: 'GrupoOpciones_Frutas', as: 'grupos' });

GrupoOpciones.belongsToMany(Topping, { through: 'GrupoOpciones_Toppings', as: 'toppings' });
Topping.belongsToMany(GrupoOpciones, { through: 'GrupoOpciones_Toppings', as: 'grupos' });

module.exports = GrupoOpciones;
