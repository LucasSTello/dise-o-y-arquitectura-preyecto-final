import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { env } from './env.js';
import { userRepository } from './dependencies.js';

const cookieExtractor = (req) => {
  if (req && req.cookies) {
    return req.cookies[env.JWT_COOKIE_NAME] || null;
  }
  return null;
};

export const initializePassport = () => {
  const options = {
    jwtFromRequest: ExtractJwt.fromExtractors([
      cookieExtractor,
      ExtractJwt.fromAuthHeaderAsBearerToken()
    ]),
    secretOrKey: env.JWT_SECRET
  };

  passport.use(
    'current',
    new JwtStrategy(options, async (jwtPayload, done) => {
      try {
        const userId = jwtPayload.sub;
        if (!userId) {
          return done(null, false, { message: 'Token JWT inválido: falta subject' });
        }

        const user = await userRepository.getUserById(userId);
        if (!user) {
          return done(null, false, { message: 'Usuario no encontrado en la base de datos' });
        }

        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    })
  );
};
