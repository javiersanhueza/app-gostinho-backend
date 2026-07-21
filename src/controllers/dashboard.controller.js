const { Op, fn, col, literal } = require('sequelize');
const Empresa = require('../models/empresa.model');
const Usuario = require('../models/usuario.model');
const Orden = require('../models/orden.model');
const Plan = require('../models/plan.model');
const ROLES = require('../config/roles');

const getAdminSistemaDashboard = async (req, res) => {
  try {
    // --- 1. Consultas para Resumen General ---
    const totalEmpresasPromise = Empresa.count();
    const empresasActivasPromise = Empresa.count({ where: { suscripcionActiva: true } });
    const totalUsuariosPromise = Usuario.count();

    // Fechas para los rangos de ventas
    const hoy = new Date();
    const inicioHoy = new Date(hoy.setHours(0, 0, 0, 0));
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    const ventasHoyPromise = Orden.findOne({
      attributes: [
        [fn('SUM', col('total')), 'monto'],
        [fn('COUNT', col('id')), 'cantidad']
      ],
      where: { created_at: { [Op.gte]: inicioHoy } },
      raw: true
    });

    const ventasMesPromise = Orden.findOne({
      attributes: [
        [fn('SUM', col('total')), 'monto'],
        [fn('COUNT', col('id')), 'cantidad']
      ],
      where: { created_at: { [Op.gte]: inicioMes } },
      raw: true
    });

    // --- 2. Consulta para Distribución de Planes ---
    const distribucionPlanesPromise = Empresa.findAll({
      attributes: [
        [col('plan.nombre'), 'planNombre'],
        [fn('COUNT', col('Empresa.id')), 'cantidad']
      ],
      include: [{
        model: Plan,
        as: 'plan',
        attributes: [] // No necesitamos atributos del plan aquí, solo el nombre
      }],
      group: ['plan.nombre'],
      raw: true
    });

    // --- 3. Consulta para Actividad Reciente ---
    const ultimasEmpresasPromise = Empresa.findAll({
      limit: 5,
      order: [['created_at', 'DESC']],
      attributes: ['id', 'nombre', ['created_at', 'fechaRegistro']]
    });

    // --- Ejecutar todas las promesas en paralelo ---
    const [
      totalEmpresas,
      empresasActivas,
      totalUsuarios,
      ventasHoy,
      ventasMes,
      distribucionPlanes,
      ultimasEmpresas
    ] = await Promise.all([
      totalEmpresasPromise,
      empresasActivasPromise,
      totalUsuariosPromise,
      ventasHoyPromise,
      ventasMesPromise,
      distribucionPlanesPromise,
      ultimasEmpresasPromise
    ]);

    // --- Ensamblar la respuesta final ---
    const dashboardData = {
      resumenGeneral: {
        totalEmpresas,
        empresasActivas,
        totalUsuarios,
        ventasHoy: {
          monto: parseInt(ventasHoy.monto) || 0,
          cantidad: parseInt(ventasHoy.cantidad) || 0
        },
        ventasMes: {
          monto: parseInt(ventasMes.monto) || 0,
          cantidad: parseInt(ventasMes.cantidad) || 0
        }
      },
      distribucionPlanes,
      actividadReciente: {
        ultimasEmpresas
      }
    };

    res.json(dashboardData);

  } catch (error) {
    console.error('Error al generar el dashboard del admin sistema:', error);
    res.status(500).json({ error: 'Error interno al generar el dashboard.' });
  }
};

module.exports = { getAdminSistemaDashboard };
