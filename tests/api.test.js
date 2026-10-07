import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../src/app.js';
import {
  userRepository,
  productRepository,
  cartRepository,
  ticketRepository
} from '../src/config/dependencies.js';
import { hashResetToken } from '../src/utils/reset-token.js';
import { env } from '../src/config/env.js';

describe('Ecommerce Backend - Suite Completa de Pruebas de Integración', () => {
  let mongoServer;
  let userToken;
  let adminToken;
  let userCookie;
  let userId;
  let userCartId;
  let otherUserId;
  let otherUserCartId;
  let adminId;
  let testProductId;

  before(async () => {
    // Iniciar servidor MongoDB en memoria para pruebas completamente aisladas
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  after(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  // 1. Health check
  describe('1. Health Check Endpoint', () => {
    it('debe responder 200 OK con mensaje operativo en GET /api/health', async () => {
      const res = await request(app).get('/api/health');
      assert.equal(res.status, 200);
      assert.equal(res.body.status, 'success');
      assert.equal(res.body.message, 'Ecommerce Backend API operativa');
      assert.ok(res.body.timestamp);
    });
  });

  // 2. Autenticación y Sesiones
  describe('2. Autenticación y Sesiones', () => {
    it('debe registrar un nuevo usuario con rol "user" y crearle un carrito único', async () => {
      const res = await request(app)
        .post('/api/sessions/register')
        .send({
          first_name: 'Lucas',
          last_name: 'Tester',
          email: 'lucas.tester@example.com',
          age: 24,
          password: 'Password123!',
          role: 'admin' // Intento del cliente de registrarse como admin (debe ser ignorado)
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.status, 'success');
      assert.equal(res.body.user.email, 'lucas.tester@example.com');
      assert.equal(res.body.user.role, 'user'); // Asegurado rol user
      assert.equal(res.body.user.password, undefined);

      userId = res.body.user.id;

      // Verificar que el usuario tenga un carrito creado y asignado
      const dbUser = await userRepository.getUserById(userId);
      assert.ok(dbUser.cart);
      userCartId = dbUser.cart.toString();
    });

    it('debe iniciar sesión correctamente, devolver token y setear cookie httpOnly', async () => {
      const res = await request(app)
        .post('/api/sessions/login')
        .send({
          email: 'lucas.tester@example.com',
          password: 'Password123!'
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.status, 'success');
      assert.ok(res.body.token);
      assert.equal(res.body.user.email, 'lucas.tester@example.com');

      userToken = res.body.token;

      // Verificar cookie jwt httpOnly
      const cookies = res.headers['set-cookie'];
      assert.ok(cookies);
      const jwtCookie = cookies.find((c) => c.startsWith(`${env.JWT_COOKIE_NAME}=`));
      assert.ok(jwtCookie);
      assert.ok(jwtCookie.includes('HttpOnly'));
      userCookie = jwtCookie.split(';')[0];
    });

    it('debe rechazar el login con contraseña incorrecta (HTTP 401)', async () => {
      const res = await request(app)
        .post('/api/sessions/login')
        .send({
          email: 'lucas.tester@example.com',
          password: 'PasswordIncorrecta'
        });

      assert.equal(res.status, 401);
      assert.equal(res.body.status, 'error');
    });

    it('debe devolver CurrentUserDTO seguro en GET /api/sessions/current sin filtrar datos sensibles', async () => {
      const res = await request(app)
        .get('/api/sessions/current')
        .set('Authorization', `Bearer ${userToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.status, 'success');
      const u = res.body.user;

      assert.equal(u.email, 'lucas.tester@example.com');
      assert.equal(u.first_name, 'Lucas');
      assert.equal(u.last_name, 'Tester');
      assert.equal(u.age, 24);
      assert.equal(u.role, 'user');

      // Campos sensibles nunca expuestos
      assert.equal(u.password, undefined);
      assert.equal(u.resetPasswordTokenHash, undefined);
      assert.equal(u.resetPasswordExpiresAt, undefined);
      assert.equal(u.resetPasswordUsedAt, undefined);
      assert.equal(u.token, undefined);
    });

    it('debe autenticar en GET /api/sessions/current usando la cookie httpOnly', async () => {
      const res = await request(app)
        .get('/api/sessions/current')
        .set('Cookie', [userCookie]);

      assert.equal(res.status, 200);
      assert.equal(res.body.user.email, 'lucas.tester@example.com');
    });

    it('debe cerrar sesión correctamente con POST /api/sessions/logout', async () => {
      const res = await request(app).post('/api/sessions/logout');
      assert.equal(res.status, 200);
      assert.equal(res.body.status, 'success');
    });
  });

  // 3. Autorización y Productos
  describe('3. Control de Acceso y Productos', () => {
    before(async () => {
      // Crear un administrador directamente en la base de datos para pruebas
      const admin = await userRepository.createUser({
        first_name: 'Admin',
        last_name: 'Boss',
        email: 'admin.boss@example.com',
        age: 35,
        password: 'AdminPassword123!',
        role: 'admin'
      });
      adminId = admin._id.toString();

      // Login del admin para obtener su token
      const res = await request(app)
        .post('/api/sessions/login')
        .send({
          email: 'admin.boss@example.com',
          password: 'AdminPassword123!'
        });
      adminToken = res.body.token;
    });

    it('un usuario estándar NO puede crear un producto (HTTP 403)', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Mouse Gamer',
          description: 'Mouse óptico 16000 DPI',
          code: 'PROD-MOU-01',
          price: 49.99,
          stock: 10,
          category: 'Periféricos'
        });

      assert.equal(res.status, 403);
      assert.equal(res.body.status, 'error');
    });

    it('un administrador SÍ puede crear un producto (HTTP 201)', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Mouse Gamer Pro',
          description: 'Mouse óptico 16000 DPI',
          code: 'PROD-MOU-01',
          price: 50.0,
          stock: 20,
          category: 'Periféricos'
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.status, 'success');
      assert.equal(res.body.product.code, 'PROD-MOU-01');
      assert.equal(res.body.product.stock, 20);
      testProductId = res.body.product._id;
    });

    it('debe rechazar la creación de producto con stock negativo o decimal (HTTP 400)', async () => {
      const resNeg = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Invalido 1',
          description: 'Desc',
          code: 'PROD-INV-01',
          price: 10,
          stock: -5,
          category: 'Test'
        });
      assert.equal(resNeg.status, 400);

      const resDec = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Invalido 2',
          description: 'Desc',
          code: 'PROD-INV-02',
          price: 10,
          stock: 5.8,
          category: 'Test'
        });
      assert.equal(resDec.status, 400);
    });

    it('un usuario estándar NO puede eliminar un producto (HTTP 403)', async () => {
      const res = await request(app)
        .delete(`/api/products/${testProductId}`)
        .set('Authorization', `Bearer ${userToken}`);

      assert.equal(res.status, 403);
    });

    it('cualquier usuario o visitante puede consultar la lista de productos (HTTP 200)', async () => {
      const res = await request(app).get('/api/products');
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.products));
      assert.ok(res.body.products.length >= 1);
    });
  });

  // 4. Carritos y Validación de Propiedad
  describe('4. Carritos y Control de Propiedad', () => {
    before(async () => {
      // Registrar un segundo usuario para probar aislamiento de carritos
      const resOther = await request(app)
        .post('/api/sessions/register')
        .send({
          first_name: 'Mariana',
          last_name: 'Segunda',
          email: 'mariana@example.com',
          age: 28,
          password: 'Password123!'
        });
      otherUserId = resOther.body.user.id;
      const otherDbUser = await userRepository.getUserById(otherUserId);
      otherUserCartId = otherDbUser.cart.toString();
    });

    it('un usuario puede agregar un producto a su propio carrito (HTTP 200)', async () => {
      const res = await request(app)
        .post(`/api/carts/${userCartId}/product/${testProductId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 3 });

      assert.equal(res.status, 200);
      assert.equal(res.body.status, 'success');
      assert.ok(res.body.cart.products.length > 0);
      const item = res.body.cart.products.find(
        (p) => (p.product._id ? p.product._id.toString() : p.product.toString()) === testProductId
      );
      assert.ok(item);
      assert.equal(item.quantity, 3);
    });

    it('un usuario NO puede acceder ni operar el carrito de otro usuario (HTTP 403)', async () => {
      // User 1 intenta ver el carrito de User 2
      const resGet = await request(app)
        .get(`/api/carts/${otherUserCartId}`)
        .set('Authorization', `Bearer ${userToken}`);

      assert.equal(resGet.status, 403);
      assert.ok(resGet.body.message.includes('Acceso denegado'));

      // User 1 intenta agregar productos al carrito de User 2
      const resPost = await request(app)
        .post(`/api/carts/${otherUserCartId}/product/${testProductId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 1 });

      assert.equal(resPost.status, 403);
    });

    it('un usuario puede modificar la cantidad de un producto en su carrito (HTTP 200)', async () => {
      const res = await request(app)
        .put(`/api/carts/${userCartId}/product/${testProductId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 5 });

      assert.equal(res.status, 200);
      const item = res.body.cart.products.find(
        (p) => (p.product._id ? p.product._id.toString() : p.product.toString()) === testProductId
      );
      assert.equal(item.quantity, 5);
    });

    it('un usuario puede eliminar un producto de su carrito (HTTP 200)', async () => {
      const res = await request(app)
        .delete(`/api/carts/${userCartId}/product/${testProductId}`)
        .set('Authorization', `Bearer ${userToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.cart.products.length, 0);
    });
  });

  // 5. Flujo de Recuperación de Contraseña
  describe('5. Flujo de Recuperación de Contraseña', () => {
    it('debe responder con mensaje genérico seguro exista o no el email en forgot-password', async () => {
      const resExisting = await request(app)
        .post('/api/sessions/forgot-password')
        .send({ email: 'lucas.tester@example.com' });

      assert.equal(resExisting.status, 200);
      assert.equal(
        resExisting.body.message,
        'Si el email existe, recibirás instrucciones para restablecer tu contraseña'
      );

      const resNotExisting = await request(app)
        .post('/api/sessions/forgot-password')
        .send({ email: 'noexiste_12345@example.com' });

      assert.equal(resNotExisting.status, 200);
      assert.equal(
        resNotExisting.body.message,
        'Si el email existe, recibirás instrucciones para restablecer tu contraseña'
      );
    });

    it('debe rechazar un token inexistente o inválido (HTTP 400)', async () => {
      const res = await request(app)
        .post('/api/sessions/reset-password/token-completamente-falso')
        .send({ newPassword: 'NuevaPasswordValida123!' });

      assert.equal(res.status, 400);
      assert.equal(res.body.message, 'El token de recuperación no es válido');
    });

    it('debe rechazar un token expirado (HTTP 400)', async () => {
      const rawToken = 'test-expired-token-1234567890abcdef';
      const hashed = hashResetToken(rawToken);

      // Asignar token con fecha de expiración en el pasado
      await userRepository.updateUser(userId, {
        resetPasswordTokenHash: hashed,
        resetPasswordExpiresAt: new Date(Date.now() - 60000), // Expirado hace 1 minuto
        resetPasswordUsedAt: null
      });

      const res = await request(app)
        .post(`/api/sessions/reset-password/${rawToken}`)
        .send({ newPassword: 'NuevaPasswordValida123!' });

      assert.equal(res.status, 400);
      assert.equal(res.body.message, 'El token de recuperación ha expirado');
    });

    it('debe rechazar un token que ya fue utilizado previamente (HTTP 400)', async () => {
      const rawToken = 'test-used-token-1234567890abcdef';
      const hashed = hashResetToken(rawToken);

      // Asignar token con fecha de uso registrada
      await userRepository.updateUser(userId, {
        resetPasswordTokenHash: hashed,
        resetPasswordExpiresAt: new Date(Date.now() + 3600000),
        resetPasswordUsedAt: new Date()
      });

      const res = await request(app)
        .post(`/api/sessions/reset-password/${rawToken}`)
        .send({ newPassword: 'NuevaPasswordValida123!' });

      assert.equal(res.status, 400);
      assert.equal(res.body.message, 'El token de recuperación ya ha sido utilizado');
    });

    it('debe rechazar si la nueva contraseña es idéntica a la anterior (HTTP 400)', async () => {
      const rawToken = 'test-same-password-token-123456';
      const hashed = hashResetToken(rawToken);

      await userRepository.updateUser(userId, {
        resetPasswordTokenHash: hashed,
        resetPasswordExpiresAt: new Date(Date.now() + 3600000),
        resetPasswordUsedAt: null
      });

      const res = await request(app)
        .post(`/api/sessions/reset-password/${rawToken}`)
        .send({ newPassword: 'Password123!' }); // Misma contraseña original de registro

      assert.equal(res.status, 400);
      assert.equal(res.body.message, 'La nueva contraseña no puede ser idéntica a la anterior');
    });

    it('debe permitir restablecer con contraseña válida e invalidar el token posterior al uso', async () => {
      const rawToken = 'test-valid-token-123456789012345';
      const hashed = hashResetToken(rawToken);

      await userRepository.updateUser(userId, {
        resetPasswordTokenHash: hashed,
        resetPasswordExpiresAt: new Date(Date.now() + 3600000),
        resetPasswordUsedAt: null
      });

      const res = await request(app)
        .post(`/api/sessions/reset-password/${rawToken}`)
        .send({ newPassword: 'CompletamenteNuevaPassword999!' });

      assert.equal(res.status, 200);
      assert.equal(res.body.message, 'Contraseña restablecida exitosamente');

      // Verificar que el token quedó marcado como usado
      const dbUser = await userRepository.getUserById(userId, '+resetPasswordUsedAt');
      assert.ok(dbUser.resetPasswordUsedAt);

      // Verificar que se puede hacer login con la nueva contraseña
      const loginRes = await request(app)
        .post('/api/sessions/login')
        .send({
          email: 'lucas.tester@example.com',
          password: 'CompletamenteNuevaPassword999!'
        });
      assert.equal(loginRes.status, 200);
      assert.ok(loginRes.body.token);
      userToken = loginRes.body.token; // Actualizar token para siguientes pruebas
    });
  });

  // 6. Proceso de Compra Atómica y Generación de Tickets
  describe('6. Proceso de Compra, Checkout y Tickets', () => {
    let productA;
    let productB;

    before(async () => {
      // Crear Producto A (stock 10, precio 100)
      productA = await productRepository.createProduct({
        title: 'Notebook Gamer',
        description: 'Laptop 16GB RAM',
        code: 'PROD-LAP-01',
        price: 100,
        stock: 10,
        category: 'Computación'
      });

      // Crear Producto B (stock 2, precio 40)
      productB = await productRepository.createProduct({
        title: 'Auriculares Inalámbricos',
        description: 'Bluetooth 5.3',
        code: 'PROD-AUR-02',
        price: 40,
        stock: 2,
        category: 'Audio'
      });
    });

    it('debe procesar una compra parcial si un producto tiene stock y otro no', async () => {
      // Vaciar carrito
      await request(app)
        .delete(`/api/carts/${userCartId}`)
        .set('Authorization', `Bearer ${userToken}`);

      // Agregar Producto A (cantidad 2, stock disponible: 10) -> DEBE COMPRARSE
      await request(app)
        .post(`/api/carts/${userCartId}/product/${productA._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 2 });

      // Agregar Producto B (cantidad 5, stock disponible: 2) -> DEBE RECHAZARSE POR FALTA DE STOCK
      await request(app)
        .post(`/api/carts/${userCartId}/product/${productB._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 5 });

      // Ejecutar checkout
      const res = await request(app)
        .post(`/api/carts/${userCartId}/purchase`)
        .set('Authorization', `Bearer ${userToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.status, 'partial');

      // 1 producto comprado (Producto A)
      assert.equal(res.body.purchased.length, 1);
      assert.equal(res.body.purchased[0].title, 'Notebook Gamer');
      assert.equal(res.body.purchased[0].quantity, 2);
      assert.equal(res.body.purchased[0].unit_price, 100);
      assert.equal(res.body.purchased[0].subtotal, 200);

      // 1 producto rechazado (Producto B)
      assert.equal(res.body.rejected.length, 1);
      assert.equal(res.body.rejected[0].title, 'Auriculares Inalámbricos');
      assert.equal(res.body.rejected[0].reason, 'Stock insuficiente');

      // Total correcto en ticket: 200
      assert.equal(res.body.total, 200);
      assert.ok(res.body.code.startsWith('TCK-'));

      // Verificar que el stock de Producto A se descontó atómicamente a 8
      const updatedA = await productRepository.getProductById(productA._id);
      assert.equal(updatedA.stock, 8);

      // Verificar que el stock de Producto B sigue intacto en 2
      const updatedB = await productRepository.getProductById(productB._id);
      assert.equal(updatedB.stock, 2);

      // Verificar que el carrito AHORA contiene ÚNICAMENTE el producto rechazado B
      const cartAfter = await cartRepository.getCartById(userCartId);
      assert.equal(cartAfter.products.length, 1);
      assert.equal(
        (cartAfter.products[0].product._id || cartAfter.products[0].product).toString(),
        productB._id.toString()
      );
    });

    it('debe devolver HTTP 409 si NINGÚN producto del carrito puede comprarse por falta de stock', async () => {
      // El carrito actualmente solo tiene Producto B (cantidad 5, stock 2)
      const res = await request(app)
        .post(`/api/carts/${userCartId}/purchase`)
        .set('Authorization', `Bearer ${userToken}`);

      assert.equal(res.status, 409);
      assert.equal(res.body.status, 'error');
      assert.ok(res.body.details.rejected.length > 0);

      // El carrito debe conservarse con el producto no comprado
      const cartAfter = await cartRepository.getCartById(userCartId);
      assert.equal(cartAfter.products.length, 1);
    });

    it('debe procesar una compra completa cuando todos los productos tienen stock suficiente', async () => {
      // Vaciar carrito
      await request(app)
        .delete(`/api/carts/${userCartId}`)
        .set('Authorization', `Bearer ${userToken}`);

      // Agregar Producto A (cantidad 3, stock disponible: 8)
      await request(app)
        .post(`/api/carts/${userCartId}/product/${productA._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 3 });

      const res = await request(app)
        .post(`/api/carts/${userCartId}/purchase`)
        .set('Authorization', `Bearer ${userToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.status, 'complete');
      assert.equal(res.body.purchased.length, 1);
      assert.equal(res.body.rejected.length, 0);
      assert.equal(res.body.total, 300);

      // El carrito debe quedar completamente vacío
      const cartAfter = await cartRepository.getCartById(userCartId);
      assert.equal(cartAfter.products.length, 0);

      // Stock actualizado de Producto A: 8 - 3 = 5
      const updatedA = await productRepository.getProductById(productA._id);
      assert.equal(updatedA.stock, 5);
    });

    it('el usuario puede consultar sus propios tickets en GET /api/tickets/mine', async () => {
      const res = await request(app)
        .get('/api/tickets/mine')
        .set('Authorization', `Bearer ${userToken}`);

      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.tickets));
      // Se crearon 2 tickets en las pruebas anteriores
      assert.equal(res.body.tickets.length, 2);
    });

    it('un usuario estándar NO puede listar todos los tickets en GET /api/tickets (HTTP 403)', async () => {
      const res = await request(app)
        .get('/api/tickets')
        .set('Authorization', `Bearer ${userToken}`);

      assert.equal(res.status, 403);
    });

    it('el administrador SÍ puede listar todos los tickets en GET /api/tickets (HTTP 200)', async () => {
      const res = await request(app)
        .get('/api/tickets')
        .set('Authorization', `Bearer ${adminToken}`);

      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.tickets));
      assert.ok(res.body.tickets.length >= 2);
    });
  });
});
