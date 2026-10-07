import { HttpError } from '../utils/httpError.js';

export const errorHandler = (err, req, res, next) => {
  // Manejo de HttpError personalizado
  if (err instanceof HttpError) {
    const response = {
      status: 'error',
      message: err.message
    };
    if (err.details) {
      response.details = err.details;
    }
    return res.status(err.statusCode).json(response);
  }

  // Manejo de CastError de Mongoose (ID de MongoDB inválido)
  if (err.name === 'CastError') {
    return res.status(400).json({
      status: 'error',
      message: `Identificador no válido para el campo '${err.path}' con valor '${err.value}'`
    });
  }

  // Manejo de ValidationError de Mongoose
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors || {}).map((e) => e.message);
    return res.status(400).json({
      status: 'error',
      message: 'Error de validación en la base de datos',
      errors: messages
    });
  }

  // Manejo de error de clave duplicada de MongoDB (código 11000)
  if (err.code === 11000) {
    const fields = Object.keys(err.keyPattern || err.keyValue || {});
    return res.status(409).json({
      status: 'error',
      message: `Conflicto: ya existe un registro con el mismo valor para '${fields.join(', ')}'`
    });
  }

  // Manejo de errores de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      message: 'Token de autenticación no válido'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      message: 'El token de autenticación ha expirado'
    });
  }

  // Errores internos no controlados (500) - No exponer detalles internos ni stack traces
  console.error('[Unhandled Internal Error]:', err.message);

  return res.status(500).json({
    status: 'error',
    message: 'Error interno del servidor. Por favor intenta más tarde.'
  });
};
