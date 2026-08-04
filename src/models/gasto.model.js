const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Empresa = require('./empresa.model');
const Sucursal = require('./sucursal.model');
const CategoriaGasto = require('./categoria_gasto.model');
const UnidadMedida = require('./unidad_medida.model');
const ProductoGasto = require('./producto_gasto.model');

const Gasto = sequelize.define('Gasto', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false
  },
  nombre_producto: {
    type: DataTypes.STRING(255),
    allowNull: true // Se cambia a true temporal/permanentemente por migracion a producto_gasto_id
  },
  cantidad: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  monto_total: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  metodo_pago: {
    type: DataTypes.STRING(50),
    allowNull: true // Ej: Efectivo, Transferencia, Tarjeta
  },
  tipo_recibo: {
    type: DataTypes.STRING(50),
    allowNull: true // Ej: Boleta, Factura
  },
  categoria_gasto_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'categorias_gasto',
      key: 'id'
    }
  },
  producto_gasto_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'productos_gasto',
      key: 'id'
    }
  },
  unidad_medida_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'unidades_medida',
      key: 'id'
    }
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
    allowNull: true, // Puede ser null si es un gasto global de la empresa
    references: {
      model: 'sucursales',
      key: 'id'
    }
  }
}, {
  tableName: 'gastos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

Gasto.belongsTo(CategoriaGasto, { foreignKey: 'categoria_gasto_id', as: 'categoria' });
CategoriaGasto.hasMany(Gasto, { foreignKey: 'categoria_gasto_id', as: 'gastos' });

Gasto.belongsTo(UnidadMedida, { foreignKey: 'unidad_medida_id', as: 'unidad' });
UnidadMedida.hasMany(Gasto, { foreignKey: 'unidad_medida_id', as: 'gastos' });

Gasto.belongsTo(Empresa, { foreignKey: 'empresa_id', as: 'empresa' });
Empresa.hasMany(Gasto, { foreignKey: 'empresa_id', as: 'gastos' });

Gasto.belongsTo(Sucursal, { foreignKey: 'sucursal_id', as: 'sucursal' });
Sucursal.hasMany(Gasto, { foreignKey: 'sucursal_id', as: 'gastos' });

Gasto.belongsTo(ProductoGasto, { foreignKey: 'producto_gasto_id', as: 'producto_gasto' });
ProductoGasto.hasMany(Gasto, { foreignKey: 'producto_gasto_id', as: 'gastos' });

module.exports = Gasto;
