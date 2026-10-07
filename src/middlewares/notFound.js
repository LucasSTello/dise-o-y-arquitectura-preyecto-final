import { HttpError } from '../utils/httpError.js';

export const notFoundHandler = (req, res, next) => {
  next(new HttpError(404, `Ruta no encontrada: ${req.method} ${req.originalUrl}`));
};
