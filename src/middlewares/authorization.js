export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'No autenticado: se requiere inicio de sesión para realizar esta acción'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: `Acceso prohibido: se requiere uno de los siguientes roles [${allowedRoles.join(', ')}] pero tu rol es '${req.user.role}'`
      });
    }

    return next();
  };
};
