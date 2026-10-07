import { Router } from 'express';
import { body, param } from 'express-validator';
import { cartController } from '../controllers/cart.controller.js';
import { purchaseController } from '../controllers/purchase.controller.js';
import { authenticateCurrentUser } from '../middlewares/authentication.js';
import { handleValidationErrors } from '../middlewares/validation.js';

const router = Router();

// Todos los endpoints de carritos requieren usuario autenticado
router.use(authenticateCurrentUser);

// Obtener carrito por ID
router.get(
  '/:cid',
  [param('cid').isMongoId().withMessage('El ID del carrito debe ser un ObjectId válido'), handleValidationErrors],
  (req, res, next) => cartController.getById(req, res, next)
);

// Agregar producto al carrito
router.post(
  '/:cid/product/:pid',
  [
    param('cid').isMongoId().withMessage('El ID del carrito debe ser un ObjectId válido'),
    param('pid').isMongoId().withMessage('El ID del producto debe ser un ObjectId válido'),
    body('quantity')
      .optional()
      .isInt({ min: 1 })
      .withMessage('La cantidad debe ser un entero mayor o igual a 1'),
    handleValidationErrors
  ],
  (req, res, next) => cartController.addProduct(req, res, next)
);

// Actualizar cantidad de un producto en el carrito
router.put(
  '/:cid/product/:pid',
  [
    param('cid').isMongoId().withMessage('El ID del carrito debe ser un ObjectId válido'),
    param('pid').isMongoId().withMessage('El ID del producto debe ser un ObjectId válido'),
    body('quantity')
      .isInt({ min: 1 })
      .withMessage('La cantidad debe ser un entero mayor o igual a 1'),
    handleValidationErrors
  ],
  (req, res, next) => cartController.updateQuantity(req, res, next)
);

// Eliminar un producto del carrito
router.delete(
  '/:cid/product/:pid',
  [
    param('cid').isMongoId().withMessage('El ID del carrito debe ser un ObjectId válido'),
    param('pid').isMongoId().withMessage('El ID del producto debe ser un ObjectId válido'),
    handleValidationErrors
  ],
  (req, res, next) => cartController.removeProduct(req, res, next)
);

// Vaciar el carrito completo
router.delete(
  '/:cid',
  [param('cid').isMongoId().withMessage('El ID del carrito debe ser un ObjectId válido'), handleValidationErrors],
  (req, res, next) => cartController.clearCart(req, res, next)
);

// Finalizar proceso de compra del carrito
router.post(
  '/:cid/purchase',
  [param('cid').isMongoId().withMessage('El ID del carrito debe ser un ObjectId válido'), handleValidationErrors],
  (req, res, next) => purchaseController.purchaseCart(req, res, next)
);

export default router;
