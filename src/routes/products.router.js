import { Router } from 'express';
import { body, param } from 'express-validator';
import { productController } from '../controllers/product.controller.js';
import { authenticateCurrentUser } from '../middlewares/authentication.js';
import { authorize } from '../middlewares/authorization.js';
import { handleValidationErrors } from '../middlewares/validation.js';

const router = Router();

// Obtener todos los productos (público / cualquier usuario)
router.get('/', (req, res, next) => productController.getAll(req, res, next));

// Obtener un producto por ID
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('El ID del producto debe ser un ObjectId válido'), handleValidationErrors],
  (req, res, next) => productController.getById(req, res, next)
);

// Crear un nuevo producto (Solo ADMIN)
router.post(
  '/',
  authenticateCurrentUser,
  authorize('admin'),
  [
    body('title').trim().notEmpty().withMessage('El título es obligatorio'),
    body('description').trim().notEmpty().withMessage('La descripción es obligatoria'),
    body('code').trim().notEmpty().withMessage('El código es obligatorio'),
    body('price')
      .isFloat({ min: 0 })
      .withMessage('El precio debe ser un número mayor o igual a 0'),
    body('stock')
      .isInt({ min: 0 })
      .withMessage('El stock debe ser un número entero mayor o igual a 0 (sin decimales ni negativos)'),
    body('category').trim().notEmpty().withMessage('La categoría es obligatoria'),
    handleValidationErrors
  ],
  (req, res, next) => productController.create(req, res, next)
);

// Modificar un producto por ID (Solo ADMIN)
router.put(
  '/:id',
  authenticateCurrentUser,
  authorize('admin'),
  [
    param('id').isMongoId().withMessage('El ID del producto debe ser un ObjectId válido'),
    body('price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('El precio debe ser un número mayor o igual a 0'),
    body('stock')
      .optional()
      .isInt({ min: 0 })
      .withMessage('El stock debe ser un número entero mayor o igual a 0 (sin decimales ni negativos)'),
    handleValidationErrors
  ],
  (req, res, next) => productController.update(req, res, next)
);

// Eliminar un producto por ID (Solo ADMIN)
router.delete(
  '/:id',
  authenticateCurrentUser,
  authorize('admin'),
  [param('id').isMongoId().withMessage('El ID del producto debe ser un ObjectId válido'), handleValidationErrors],
  (req, res, next) => productController.delete(req, res, next)
);

export default router;
