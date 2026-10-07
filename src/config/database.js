import mongoose from 'mongoose';
import { env } from './env.js';

let isConnected = false;
let memoryServerInstance = null;

export const connectDB = async (customUri = null) => {
  if (isConnected) {
    return;
  }

  const targetUri = customUri || env.MONGO_URL;

  try {
    const conn = await mongoose.connect(targetUri, { serverSelectionTimeoutMS: 2000 });
    isConnected = true;
    console.log(`[Database] Conexión establecida exitosamente con MongoDB: ${conn.connection.name}`);
  } catch (error) {
    const isLocalhost = targetUri.includes('127.0.0.1') || targetUri.includes('localhost');
    if (env.NODE_ENV === 'development' && isLocalhost) {
      console.warn(`[Database] No se detectó MongoDB local activo (${error.message}).`);
      console.log('[Database] Inicializando MongoDB en memoria (MongoMemoryServer) para desarrollo continuo...');
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        memoryServerInstance = await MongoMemoryServer.create({ instance: { dbName: 'ecommerce' } });
        const memUri = memoryServerInstance.getUri();
        const conn = await mongoose.connect(memUri);
        isConnected = true;
        console.log(`[Database] Conectado exitosamente a MongoDB en memoria: ${conn.connection.name} (${memUri})`);
        return;
      } catch (memErr) {
        console.error(`[Database Error] Fallo al inicializar MongoDB en memoria: ${memErr.message}`);
        throw error;
      }
    }

    console.error(`[Database Error] Fallo al conectar con MongoDB: ${error.message}`);
    throw error;
  }
};

export const disconnectDB = async () => {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    if (memoryServerInstance) {
      await memoryServerInstance.stop();
      memoryServerInstance = null;
    }
    console.log('[Database] Desconexión de MongoDB completada.');
  } catch (error) {
    console.error(`[Database Error] Error al desconectar de MongoDB: ${error.message}`);
    throw error;
  }
};
