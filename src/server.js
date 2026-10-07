import app from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/database.js';

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(env.PORT, () => {
      console.log(`[Server] Servidor escuchando activamente en el puerto ${env.PORT}`);
      console.log(`[Server] Entorno: ${env.NODE_ENV}`);
      console.log(`[Server] Health Check disponible en: http://localhost:${env.PORT}/api/health`);
    });

    const gracefulShutdown = async (signal) => {
      console.log(`\n[Server] Señal ${signal} recibida. Cerrando servidor de forma segura...`);
      server.close(async () => {
        console.log('[Server] Conexiones HTTP finalizadas.');
        await disconnectDB();
        process.exit(0);
      });
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  } catch (error) {
    console.error(`[Server Fatal Error] No se pudo inicializar el servidor: ${error.message}`);
    process.exit(1);
  }
};

startServer();
