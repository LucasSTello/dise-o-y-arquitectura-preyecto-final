import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = ['MONGO_URL', 'JWT_SECRET'];

const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingEnvVars.length > 0) {
  throw new Error(
    `[Config Error] Faltan variables de entorno obligatorias: ${missingEnvVars.join(', ')}. ` +
      'Por favor verifica el archivo .env.'
  );
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 8080,
  MONGO_URL: process.env.MONGO_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  JWT_COOKIE_NAME: process.env.JWT_COOKIE_NAME || 'jwt',
  RESET_PASSWORD_EXPIRES_MINUTES: Number(process.env.RESET_PASSWORD_EXPIRES_MINUTES) || 60,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  MAIL_HOST: process.env.MAIL_HOST || 'smtp.example.com',
  MAIL_PORT: Number(process.env.MAIL_PORT) || 587,
  MAIL_SECURE: process.env.MAIL_SECURE === 'true',
  MAIL_USER: process.env.MAIL_USER || '',
  MAIL_PASSWORD: process.env.MAIL_PASSWORD || '',
  MAIL_FROM: process.env.MAIL_FROM || 'noreply@ecommerce.com',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@example.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'AdminPassword123'
};
