import { UserDAO } from '../dao/user.dao.js';
import { ProductDAO } from '../dao/product.dao.js';
import { CartDAO } from '../dao/cart.dao.js';
import { TicketDAO } from '../dao/ticket.dao.js';

import { UserRepository } from '../repositories/user.repository.js';
import { ProductRepository } from '../repositories/product.repository.js';
import { CartRepository } from '../repositories/cart.repository.js';
import { TicketRepository } from '../repositories/ticket.repository.js';

import { EmailService } from '../services/email.service.js';
import { UserService } from '../services/user.service.js';
import { AuthService } from '../services/auth.service.js';
import { PasswordRecoveryService } from '../services/password-recovery.service.js';
import { ProductService } from '../services/product.service.js';
import { CartService } from '../services/cart.service.js';
import { PurchaseService } from '../services/purchase.service.js';
import { TicketService } from '../services/ticket.service.js';

// Instanciación de DAOs
export const userDAO = new UserDAO();
export const productDAO = new ProductDAO();
export const cartDAO = new CartDAO();
export const ticketDAO = new TicketDAO();

// Instanciación de Repositorios (inyectando DAOs)
export const userRepository = new UserRepository(userDAO);
export const productRepository = new ProductRepository(productDAO);
export const cartRepository = new CartRepository(cartDAO);
export const ticketRepository = new TicketRepository(ticketDAO);

// Instanciación de Servicios (inyectando Repositorios y Servicios auxiliares)
export const emailService = new EmailService();
export const userService = new UserService(userRepository);
export const authService = new AuthService(userRepository, cartRepository);
export const passwordRecoveryService = new PasswordRecoveryService(userRepository, emailService);
export const productService = new ProductService(productRepository);
export const cartService = new CartService(cartRepository, productRepository);
export const purchaseService = new PurchaseService(cartRepository, productRepository, ticketRepository);
export const ticketService = new TicketService(ticketRepository);
