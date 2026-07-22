const jwt = require('jsonwebtoken');

const verificarRol = (rolesPermitidos) => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No se proporcionó un token válido' });
      }

      const token = authHeader.split(' ')[1];
      req.usuario = jwt.verify(token, process.env.JWT_SECRET);

      // --- Lógica de Roles Múltiples Actualizada ---
      // req.usuario.roles es ahora un array, ej: ["ADMIN_EMPRESA", "CAJERO"]
      // rolesPermitidos es el array que define la ruta, ej: ["ADMIN_SUCURSAL", "CAJERO"]
      
      const tienePermiso = req.usuario.roles.some(rolUsuario => rolesPermitidos.includes(rolUsuario));

      if (!tienePermiso) {
        return res.status(403).json({
          error: `Acceso denegado. Se requiere uno de estos roles: ${rolesPermitidos.join(', ')}`
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({ error: 'Token inválido o expirado. Inicia sesión nuevamente.' });
    }
  };
};

module.exports = { verificarRol };
