import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';
import { generateResetToken, hashResetToken } from '../utils/reset-token.js';

export class PasswordRecoveryService {
  constructor(userRepository, emailService) {
    this.userRepository = userRepository;
    this.emailService = emailService;
  }

  async requestPasswordRecovery(email) {
    if (!email) {
      throw new HttpError(400, 'El correo electrónico es obligatorio');
    }

    const user = await this.userRepository.getUserByEmail(email);

    if (user) {
      const { rawToken, hashedToken } = generateResetToken();
      const expiresAt = new Date(Date.now() + env.RESET_PASSWORD_EXPIRES_MINUTES * 60 * 1000);

      await this.userRepository.updateUser(user._id, {
        resetPasswordTokenHash: hashedToken,
        resetPasswordExpiresAt: expiresAt,
        resetPasswordUsedAt: null
      });

      try {
        await this.emailService.sendPasswordRecoveryEmail(user.email, rawToken, user.first_name);
      } catch (err) {
        console.error(`[PasswordRecoveryService] Error al enviar email: ${err.message}`);
        if (env.NODE_ENV === 'production') {
          throw err;
        }
      }
    }

    // Por seguridad, siempre responder con el mismo mensaje exista o no el correo
    return {
      message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña'
    };
  }

  async resetPassword(token, newPassword) {
    if (!token) {
      throw new HttpError(400, 'El token de recuperación es obligatorio');
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      throw new HttpError(400, 'La nueva contraseña debe tener al menos 6 caracteres');
    }

    const hashedToken = hashResetToken(token);
    const user = await this.userRepository.getUserByResetTokenHash(
      hashedToken,
      '+password +resetPasswordTokenHash +resetPasswordExpiresAt +resetPasswordUsedAt'
    );

    if (!user) {
      throw new HttpError(400, 'El token de recuperación no es válido');
    }

    if (user.resetPasswordUsedAt) {
      throw new HttpError(400, 'El token de recuperación ya ha sido utilizado');
    }

    if (!user.resetPasswordExpiresAt || new Date() > new Date(user.resetPasswordExpiresAt)) {
      throw new HttpError(400, 'El token de recuperación ha expirado');
    }

    // Verificar que la nueva contraseña sea diferente a la actual
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      throw new HttpError(400, 'La nueva contraseña no puede ser idéntica a la anterior');
    }

    // Actualizar contraseña e invalidar token
    user.password = newPassword;
    user.resetPasswordUsedAt = new Date();
    await user.save();

    return {
      message: 'Contraseña restablecida exitosamente'
    };
  }
}
