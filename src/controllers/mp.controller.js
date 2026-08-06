const axios = require('axios');
const logger = require('../config/logger');

// 🔴 IMPORTANTE: REEMPLAZA ESTO CON TU ACCESS TOKEN DE PRODUCCIÓN
const ACCESS_TOKEN = 'APP_USR-7544058536266800-020722-803e26eb22266ee85dd101cb614b601e-3020348327';

const api = axios.create({
  baseURL: 'https://api.mercadopago.com/',
  headers: {
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 segundos de espera máximo antes de fallar
});

const generarUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const getDispositivos = async (req, res) => {
  try {
    const response = await api.get('terminals/v1/list');
    res.json({ success: true, devices: response.data.data.terminals });
  } catch (error) {
    logger.error('Error MP GetDispositivos: ' + error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

const crearIntentoPago = async (req, res) => {
  try {
    const { deviceId, monto, descripcion, folio } = req.body;
    
    if (!deviceId || !monto) {
        return res.status(400).json({ success: false, error: 'Faltan datos obligatorios (deviceId, monto)'});
    }

    const montoString = Math.round(monto).toString();
    const terminalIdString = String(deviceId).trim();

    const payload = {
      "type": "point",
      "description": descripcion || `Gostinho #${folio || 'Venta'}`,
      "external_reference": `${folio || new Date().getTime()}`,
      "expiration_time": "PT2M", // Damos 2 minutos por seguridad
      "config": {
        "point": { "terminal_id": terminalIdString }
      },
      "transactions": {
        "payments": [{ "amount": montoString }]
      }
    };

    const config = { headers: { 'X-Idempotency-Key': generarUUID() } };

    logger.info('🚀 Creando orden MP...');
    const response = await api.post('/v1/orders', payload, config);

    res.json({ success: true, paymentIntentId: response.data.id });

  } catch (error) {
    logger.error('Error MP Crear: ' + error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

const verificarEstadoPago = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
        return res.status(400).json({ success: false, error: 'Falta orderId' });
    }

    const response = await api.get(`/v1/orders/${orderId}`);
    const order = response.data;
    const estadoOrden = order.status; // 'processed', 'at_terminal', 'failed', etc.

    // --- ESCENARIO 1: ÉXITO (Cobro realizado) ---
    if (estadoOrden === 'processed') {
      const pagos = order.transactions?.payments || [];
      const pagoAprobado = pagos.find(p => p.status === 'approved') || pagos[0];

      return res.json({
        success: true,
        estado: 'APROBADO',
        data: {
          id_pago: pagoAprobado?.id || order.id,
          monto: pagoAprobado?.amount,
          tarjeta: pagoAprobado?.payment_method?.type || 'TARJETA', // credito/debito
          marca: pagoAprobado?.payment_method?.id, // master/visa
          lote: pagoAprobado?.id
        }
      });
    }

    // --- ESCENARIO 2: FALLO O CANCELACIÓN ---
    if (estadoOrden === 'canceled' || estadoOrden === 'failed') {
      return res.json({
        success: true,
        estado: 'RECHAZADO',
        motivo: estadoOrden
      });
    }

    // --- ESCENARIO 3: CASO RARO (Acción Requerida) ---
    if (estadoOrden === 'action_required') {
      return res.json({ success: true, estado: 'RECHAZADO', motivo: 'Error de comunicación, revisar terminal' });
    }

    // --- ESCENARIO 4: SIGUE ESPERANDO ---
    return res.json({ success: true, estado: 'PENDIENTE' });

  } catch (error) {
    logger.error("Error consultando orden: " + error.message);
    // Si da error 404 es que la orden no existe aún, así que es pendiente
    res.json({ success: false, error: error.message });
  }
};

const cancelarIntentoPago = async (req, res) => {
  const { orderId } = req.params;

  logger.info(`🛑 Cancelando Orden ID: ${orderId}`);

  if (!orderId) {
    return res.status(400).json({ success: false, error: "ID de orden inválido o vacío" });
  }

  try {
    const response = await api.post(`/v1/orders/${orderId}/cancel`, {}, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`, 
        'X-Idempotency-Key': generarUUID()
      }
    });
    return res.json({ success: true });

  } catch (error) {
    const errorMP = error.response?.data?.errors?.[0];
    if (errorMP?.code === 'order_already_canceled') return res.json({ success: true });
    if (errorMP?.code === 'cannot_cancel_order') return res.status(400).json({ success: false, accion_requerida: 'MANUAL' });

    logger.error('Error cancelando MP: ' + (error.response?.data || error.message));
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getDispositivos,
  crearIntentoPago,
  verificarEstadoPago,
  cancelarIntentoPago
};
