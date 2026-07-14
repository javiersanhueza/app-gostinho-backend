const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Empresa = require('./empresa.model');
const Sucursal = require('./sucursal.model');
const Cliente = require('./cliente.model');
const Comanda = require('./comanda.model');

const Orden = sequelize.define('Orden', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  folio: {
    // En PostgreSQL, SERIAL es un alias para INTEGER con autoIncrement y una secuencia.
    // Sequelize maneja esta traducción si usamos el tipo correcto.
    type: DataTypes.INTEGER, 
    autoIncrement: true,
    allowNull: false,
    unique: true
  },
  total: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  metodo_pago: {
    type: DataTypes.STRING(255),
    defaultValue: 'EFECTIVO'
  },
  estado: {
    type: DataTypes.STRING(255),
    defaultValue: 'PENDIENTE' // PENDIENTE, PAGADO, EN_PREPARACION, LISTO, ENTREGADO
  },
  tipo_entrega: {
    type: DataTypes.STRING(50),
    defaultValue: 'LOCAL' // LOCAL, TAKEAWAY, DELIVERY
  },
  codigo_reclamo: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true
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
  },
  cliente_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'clientes',
      key: 'id'
    }
  },
  comanda_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'comandas',
      key: 'id'
    }
  }
}, {
  tableName: 'ordenes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Relaciones
Orden.belongsTo(Empresa, { foreignKey: 'empresa_id', as: 'empresa' });
Empresa.hasMany(Orden, { foreignKey: 'empresa_id', as: 'ordenes' });

Orden.belongsTo(Sucursal, { foreignKey: 'sucursal_id', as: 'sucursal' });
Sucursal.hasMany(Orden, { foreignKey: 'sucursal_id', as: 'ordenes' });

Orden.belongsTo(Cliente, { foreignKey: 'cliente_id', as: 'cliente' });
Cliente.hasMany(Orden, { foreignKey: 'cliente_id', as: 'ordenes' });

Orden.belongsTo(Comanda, { foreignKey: 'comanda_id', as: 'comanda' });
Comanda.hasMany(Orden, { foreignKey: 'comanda_id', as: 'ordenes' });

module.exports = Orden;
