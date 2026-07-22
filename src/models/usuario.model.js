const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Empresa = require('./empresa.model');
const Sucursal = require('./sucursal.model');
const Rol = require('./rol.model');

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
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  empresa_id: {
    type: DataTypes.UUID,
    allowNull: true,
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
  tableName: 'usuarios',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// --- NUEVA RELACIÓN MUCHOS A MUCHOS ---
const UsuarioRoles = sequelize.define('usuario_roles', {
  usuario_id: {
    type: DataTypes.UUID,
    references: {
      model: Usuario,
      key: 'id'
    }
  },
  rol_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Rol,
      key: 'id'
    }
  }
}, { timestamps: false });

Usuario.belongsToMany(Rol, { through: UsuarioRoles, foreignKey: 'usuario_id', as: 'roles' });
Rol.belongsToMany(Usuario, { through: UsuarioRoles, foreignKey: 'rol_id', as: 'usuarios' });

// --- Relaciones Anteriores ---
Usuario.belongsTo(Empresa, { foreignKey: 'empresa_id', as: 'empresa' });
Usuario.belongsTo(Sucursal, { foreignKey: 'sucursal_id', as: 'sucursal' });

module.exports = Usuario;
