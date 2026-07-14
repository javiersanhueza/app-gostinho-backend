const ROLES = {
  ADMIN_SISTEMA: 'ADMIN_SISTEMA',
  ADMIN_EMPRESA: 'ADMIN_EMPRESA', // Dueño o encargado de toda la empresa (todas sus sucursales)
  ADMIN_SUCURSAL: 'ADMIN_SUCURSAL', // Encargado de una sucursal específica
  CAJERO: 'CAJERO',
  COCINERO: 'COCINERO',
  CLIENTE: 'CLIENTE' // Comensal final que usa la app web para escanear QR y hacer pedidos
};

module.exports = ROLES;
