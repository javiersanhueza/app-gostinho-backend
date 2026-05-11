const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Empresa = require('./empresa.model');
const Sucursal = require('./sucursal.model');
const ROLES = require('../config/roles');

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  rol: {
    type: DataTypes.STRING,
    defaultValue: ROLES.CAJERO,
    validate: {
      isIn: {
        args: [Object.values(ROLES)],
        msg: "El rol especificado no es válido"
      }
    }
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  // Relaciones
  empresa_id: {
    type: DataTypes.UUID,
    allowNull: true, // NULL si es ADMIN_SISTEMA
    references: {
      model: 'empresas',
      key: 'id'
    }
  },
  sucursal_id: {
    type: DataTypes.UUID,
    allowNull: true, // NULL si es ADMIN_SISTEMA o ADMIN_LOCAL (dueño de empresa)
    references: {
      model: 'sucursales',
      key: 'id'
    }
  }
}, {
  tableName: 'usuarios',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Definición de Asociaciones
Usuario.belongsTo(Empresa, { foreignKey: 'empresa_id', as: 'empresa' });
Usuario.belongsTo(Sucursal, { foreignKey: 'sucursal_id', as: 'sucursal' });

module.exports = Usuario;
