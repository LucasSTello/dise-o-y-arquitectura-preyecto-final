import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

export class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    if (!env.MAIL_HOST || env.MAIL_HOST === 'smtp.example.com') {
      // Indicador de que el host es de prueba o no configurado
      this.transporter = null;
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: env.MAIL_HOST,
      port: env.MAIL_PORT,
      secure: env.MAIL_SECURE,
      auth: {
        user: env.MAIL_USER,
        pass: env.MAIL_PASSWORD
      }
    });
  }

  async sendPasswordRecoveryEmail(toEmail, resetToken, userName = 'Usuario') {
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; color: #333; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .btn { display: inline-block; padding: 12px 24px; background-color: #0066cc; color: #ffffff !important; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 20px 0; }
          .link-box { word-break: break-all; background: #f0f4f8; padding: 10px; border-radius: 4px; font-size: 13px; }
          .warning { font-size: 13px; color: #666; margin-top: 20px; border-top: 1px solid #e0e0e0; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Hola, ${userName}</h2>
          <p>Has solicitado restablecer tu contraseña en nuestra plataforma de comercio electrónico.</p>
          <p>Para crear una nueva contraseña, haz clic en el siguiente botón:</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="btn" target="_blank">Restablecer contraseña</a>
          </p>
          <p>O copia y pega el siguiente enlace en tu navegador:</p>
          <p class="link-box"><a href="${resetUrl}">${resetUrl}</a></p>
          <div class="warning">
            <p><strong>Aviso de seguridad:</strong> Este enlace expirará exactamente en 1 hora (60 minutos).</p>
            <p>Si tú no solicitaste este cambio, puedes ignorar este correo; tu cuenta permanecerá segura.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    if (!this.transporter) {
      console.warn(
        `[EmailService] SMTP no configurado con credenciales válidas en .env (MAIL_HOST=${env.MAIL_HOST}). ` +
          `Enlace de restablecimiento generado para desarrollo/pruebas: ${resetUrl}`
      );
      // No ocultar el estado si está en producción o si se requiere reportar
      if (env.NODE_ENV === 'production') {
        throw new HttpError(
          500,
          'El servicio de correo electrónico no está configurado adecuadamente para enviar el mensaje.'
        );
      }
      return { simulated: true, resetUrl };
    }

    try {
      const info = await this.transporter.sendMail({
        from: env.MAIL_FROM,
        to: toEmail,
        subject: 'Recuperación de contraseña - Ecommerce',
        html: htmlContent
      });
      return { simulated: false, messageId: info.messageId };
    } catch (error) {
      console.error(`[EmailService Error] Fallo al enviar correo: ${error.message}`);
      throw new HttpError(
        500,
        `Error al enviar el correo de recuperación: ${error.message}`
      );
    }
  }
}
