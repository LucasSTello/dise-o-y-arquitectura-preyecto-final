import { env } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/database.js';
import { userRepository, cartRepository } from '../config/dependencies.js';

const run = async () => {
  try {
    console.log('[Create Admin Script] Conectando a la base de datos...');
    await connectDB();

    const adminEmail = env.ADMIN_EMAIL.toLowerCase().trim();
    const adminPassword = env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.error('[Create Admin Script] Error: ADMIN_EMAIL o ADMIN_PASSWORD no están configurados en .env.');
      await disconnectDB();
      process.exit(1);
    }

    const existingUser = await userRepository.getUserByEmail(adminEmail, '+password');

    if (existingUser) {
      console.log(`[Create Admin Script] El usuario con email '${adminEmail}' ya existe.`);
      let needsSave = false;

      if (existingUser.role !== 'admin') {
        existingUser.role = 'admin';
        needsSave = true;
        console.log(`[Create Admin Script] Rol actualizado a 'admin'.`);
      }

      if (!existingUser.cart) {
        const cart = await cartRepository.createCart({
          user: existingUser._id,
          products: []
        });
        existingUser.cart = cart._id;
        needsSave = true;
        console.log(`[Create Admin Script] Carrito único creado y asignado al usuario admin.`);
      }

      if (needsSave) {
        await existingUser.save();
      } else {
        console.log(`[Create Admin Script] El usuario ya cuenta con rol 'admin' y carrito asignado.`);
      }
    } else {
      console.log(`[Create Admin Script] Creando nuevo usuario administrador con email: ${adminEmail}...`);

      const newAdmin = await userRepository.createUser({
        first_name: 'Admin',
        last_name: 'System',
        email: adminEmail,
        age: 30,
        password: adminPassword,
        role: 'admin'
      });

      const newCart = await cartRepository.createCart({
        user: newAdmin._id,
        products: []
      });

      await userRepository.updateUser(newAdmin._id, { cart: newCart._id });

      console.log(`[Create Admin Script] Administrador creado exitosamente con ID: ${newAdmin._id}`);
    }

    console.log('[Create Admin Script] Operación completada con éxito.');
  } catch (error) {
    console.error(`[Create Admin Script Error]: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
    console.log('[Create Admin Script] Conexión cerrada.');
    process.exit(process.exitCode || 0);
  }
};

run();
