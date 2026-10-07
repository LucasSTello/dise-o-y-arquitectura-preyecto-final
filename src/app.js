import express from 'express';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import { initializePassport } from './config/passport.config.js';

import sessionsRouter from './routes/sessions.router.js';
import productsRouter from './routes/products.router.js';
import cartsRouter from './routes/carts.router.js';
import ticketsRouter from './routes/tickets.router.js';

import { notFoundHandler } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

// Middlewares globales de parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Inicialización de Passport y estrategias JWT
initializePassport();
app.use(passport.initialize());

// Endpoint de verificación de salud de la API
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Ecommerce Backend API operativa',
    timestamp: new Date().toISOString()
  });
});

// Enrutadores principales
app.use('/api/sessions', sessionsRouter);
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);
app.use('/api/tickets', ticketsRouter);

// Manejo de rutas inexistentes (404)
app.use(notFoundHandler);

// Manejo centralizado de errores
app.use(errorHandler);

export default app;
