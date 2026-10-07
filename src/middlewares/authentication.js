import passport from 'passport';

export const authenticateCurrentUser = (req, res, next) => {
  passport.authenticate('current', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'No autenticado: token no proporcionado o inválido',
        detail: info?.message || 'Token no válido'
      });
    }

    req.user = user;
    return next();
  })(req, res, next);
};
