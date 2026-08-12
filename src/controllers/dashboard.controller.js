const logger = require('../utils/logger');
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
    logger.error('Error al generar el dashboard del admin sistema:', error);
    res.status(500).json({ error: 'Error interno al generar el dashboard.' });
  }
};

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
const endOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
const subDays = (d, days) => new Date(d.getTime() - days * 24 * 60 * 60 * 1000);
const subMonths = (d, months) => {
  const newDate = new Date(d);
  newDate.setMonth(newDate.getMonth() - months);
  return newDate;
};

const getEmpresaDashboard = async (req, res) => {
  try {
    const { empresa_id, sucursal_id, roles } = req.usuario;
    // Si envían sucursal_id, la usamos. Si el usuario no es ADMIN_EMPRESA, forzamos su propia sucursal_id.
    const querySucursal = req.query.sucursal_id;
    let finalSucursalId = null;
    
    if (roles && roles.includes(ROLES.ADMIN_EMPRESA)) {
        finalSucursalId = querySucursal || null; 
    } else {
        finalSucursalId = sucursal_id;
    }

    const where = {};
    if (finalSucursalId) {
        where.sucursal_id = finalSucursalId;
    } else {
        where.empresa_id = empresa_id;
    }

    const hoy = new Date();
    const ayer = subDays(hoy, 1);
    const mesPasado = subMonths(hoy, 1);

    const calcSum = async (start, end) => {
      const resp = await Orden.findOne({
        attributes: [[fn('SUM', col('total')), 'monto']],
        where: { ...where, created_at: { [Op.between]: [start, end] } },
        raw: true
      });
      return parseInt(resp?.monto) || 0;
    };

    const ventasHoy = await calcSum(startOfDay(hoy), endOfDay(hoy));
    const ventasAyer = await calcSum(startOfDay(ayer), endOfDay(ayer));
    const crecimientoHoy = ventasAyer > 0 ? parseFloat(((ventasHoy - ventasAyer) / ventasAyer * 100).toFixed(1)) : (ventasHoy > 0 ? 100 : 0);

    const ventasMes = await calcSum(startOfMonth(hoy), endOfMonth(hoy));
    const ventasMesPasado = await calcSum(startOfMonth(mesPasado), endOfMonth(mesPasado));
    const crecimientoMes = ventasMesPasado > 0 ? parseFloat(((ventasMes - ventasMesPasado) / ventasMesPasado * 100).toFixed(1)) : (ventasMes > 0 ? 100 : 0);

    // Ventas últimos 7 días
    const ventasSemana = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(hoy, i);
      const sum = await calcSum(startOfDay(d), endOfDay(d));
      ventasSemana.push({ date: d.toISOString(), total: sum });
    }

    res.json({
      ventasHoy,
      ventasAyer,
      crecimientoHoy,
      ventasMes,
      ventasMesPasado,
      crecimientoMes,
      ventasSemana
    });
  } catch (error) {
    logger.error('Error en getEmpresaDashboard:', error);
    res.status(500).json({ mensaje: 'Error interno al cargar métricas del dashboard' });
  }
};

module.exports = {
  getAdminSistemaDashboard,
  getEmpresaDashboard
};
