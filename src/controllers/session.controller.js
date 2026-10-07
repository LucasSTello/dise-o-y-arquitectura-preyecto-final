import { authService, passwordRecoveryService } from '../config/dependencies.js';
import { CurrentUserDTO } from '../dto/current-user.dto.js';
import { setAuthCookie, clearAuthCookie } from '../utils/auth-cookie.js';

export class SessionController {
  async register(req, res, next) {
    try {
      const userDto = await authService.register(req.body);
      return res.status(201).json({
        status: 'success',
        message: 'Usuario registrado exitosamente',
        user: userDto
      });
    } catch (error) {
      return next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const { user, token } = await authService.login(email, password);

      setAuthCookie(res, token);

      return res.status(200).json({
        status: 'success',
        message: 'Inicio de sesión exitoso',
        user,
        token
      });
    } catch (error) {
      return next(error);
    }
  }

  async logout(req, res, next) {
    try {
      clearAuthCookie(res);
      return res.status(200).json({
        status: 'success',
        message: 'Sesión cerrada exitosamente'
      });
    } catch (error) {
      return next(error);
    }
  }

  async current(req, res, next) {
    try {
      // req.user ya fue adjuntado por authenticateCurrentUser desde MongoDB
      const currentUser = new CurrentUserDTO(req.user);
      return res.status(200).json({
        status: 'success',
        user: currentUser
      });
    } catch (error) {
      return next(error);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const result = await passwordRecoveryService.requestPasswordRecovery(email);
      return res.status(200).json({
        status: 'success',
        message: result.message
      });
    } catch (error) {
      return next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { token } = req.params;
      const { newPassword } = req.body;
      const result = await passwordRecoveryService.resetPassword(token, newPassword);
      return res.status(200).json({
        status: 'success',
        message: result.message
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const sessionController = new SessionController();
