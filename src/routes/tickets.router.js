import { Router } from 'express';
import { param } from 'express-validator';
import { ticketController } from '../controllers/ticket.controller.js';
import { authenticateCurrentUser } from '../middlewares/authentication.js';
import { authorize } from '../middlewares/authorization.js';
import { handleValidationErrors } from '../middlewares/validation.js';

const router = Router();

// Todos los endpoints de tickets requieren usuario autenticado
router.use(authenticateCurrentUser);

// 1. Obtener los tickets del usuario autenticado (/mine antes de /:id para evitar colisiones de rutas)
router.get('/mine', (req, res, next) => ticketController.getMyTickets(req, res, next));

// 2. Obtener todos los tickets (Solo ADMIN)
router.get('/', authorize('admin'), (req, res, next) => ticketController.getAll(req, res, next));

// 3. Obtener un ticket por ID (Propietario o ADMIN)
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('El ID del ticket debe ser un ObjectId válido'), handleValidationErrors],
  (req, res, next) => ticketController.getById(req, res, next)
);

export default router;
