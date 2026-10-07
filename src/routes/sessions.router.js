import { Router } from 'express';
import { body, param } from 'express-validator';
import { sessionController } from '../controllers/session.controller.js';
import { authenticateCurrentUser } from '../middlewares/authentication.js';
import { handleValidationErrors } from '../middlewares/validation.js';

const router = Router();

// Registro de usuario
router.post(
  '/register',
  [
    body('first_name').trim().notEmpty().withMessage('El nombre es obligatorio'),
    body('last_name').trim().notEmpty().withMessage('El apellido es obligatorio'),
    body('email').trim().isEmail().withMessage('Debe proporcionar un email válido').normalizeEmail(),
    body('age')
      .isInt({ min: 18 })
      .withMessage('La edad debe ser un número entero mayor o igual a 18 años'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('La contraseña debe contener al menos 6 caracteres'),
    handleValidationErrors
  ],
  (req, res, next) => sessionController.register(req, res, next)
);

// Inicio de sesión
router.post(
  '/login',
  [
    body('email').trim().isEmail().withMessage('Debe proporcionar un email válido').normalizeEmail(),
    body('password').notEmpty().withMessage('La contraseña es obligatoria'),
    handleValidationErrors
  ],
  (req, res, next) => sessionController.login(req, res, next)
);

// Cierre de sesión
router.post('/logout', (req, res, next) => sessionController.logout(req, res, next));

// Obtener usuario autenticado actual (Current User DTO)
router.get(
  '/current',
  authenticateCurrentUser,
  (req, res, next) => sessionController.current(req, res, next)
);

// Solicitud de restablecimiento de contraseña (Forgot password)
router.post(
  '/forgot-password',
  [
    body('email').trim().isEmail().withMessage('Debe proporcionar un email válido').normalizeEmail(),
    handleValidationErrors
  ],
  (req, res, next) => sessionController.forgotPassword(req, res, next)
);

// Restablecimiento de contraseña con token
router.post(
  '/reset-password/:token',
  [
    param('token').notEmpty().withMessage('El token de restablecimiento es obligatorio'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('La nueva contraseña debe tener al menos 6 caracteres'),
    handleValidationErrors
  ],
  (req, res, next) => sessionController.resetPassword(req, res, next)
);

export default router;
