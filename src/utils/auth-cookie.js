import { env } from '../config/env.js';

export const setAuthCookie = (res, token) => {
  const isProduction = env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 1 día
  };

  res.cookie(env.JWT_COOKIE_NAME, token, cookieOptions);
};

export const clearAuthCookie = (res) => {
  res.clearCookie(env.JWT_COOKIE_NAME, {
    httpOnly: true,
    sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax'
  });
};
