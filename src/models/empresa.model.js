const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Plan = require('./plan.model');

const Empresa = sequelize.define('Empresa', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  rut: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: true
  },
  suscripcionActiva: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  fechaVencimiento: {
    type: DataTypes.DATE,
    allowNull: true
  },
  plan_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'planes', // Asegúrate de que la tabla de planes exista
      key: 'id'
    }
  }
}, {
  tableName: 'empresas',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

Empresa.belongsTo(Plan, { foreignKey: 'plan_id', as: 'plan' });
Plan.hasMany(Empresa, { foreignKey: 'plan_id', as: 'empresas' })

module.exports = Empresa;
