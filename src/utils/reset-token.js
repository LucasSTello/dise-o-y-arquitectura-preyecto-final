import crypto from 'node:crypto';

export const generateResetToken = () => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = hashResetToken(rawToken);
  return { rawToken, hashedToken };
};

export const hashResetToken = (rawToken) => {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
};
