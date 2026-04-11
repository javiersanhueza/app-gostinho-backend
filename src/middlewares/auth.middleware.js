// src/middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');

const verificarRol = (rolesPermitidos) => {
  return (req, res, next) => {
    try {
      // 1. Obtener el token del header "Authorization: Bearer <token>"
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No se proporcionó un token válido' });
      }

      const token = authHeader.split(' ')[1];

      // 2. Desencriptar el token usando tu secreto
      // 3. Guardar los datos del usuario en la petición (para usarlos en los controladores)
      req.usuario = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Verificar si su rol está en la lista de permitidos
      if (!rolesPermitidos.includes(req.usuario.rol)) {
        return res.status(403).json({
          error: `Acceso denegado. Se requiere uno de estos roles: ${rolesPermitidos.join(', ')}`
        });
      }

      // 5. ¡Pase libre!
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Token inválido o expirado. Inicia sesión nuevamente.' });
    }
  };
};

module.exports = { verificarRol };
