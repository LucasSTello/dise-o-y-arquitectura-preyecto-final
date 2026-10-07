import crypto from 'node:crypto';

export const generateTicketCode = () => {
  const timestamp = Date.now();
  const randomSuffix = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `TCK-${timestamp}-${randomSuffix}`;
};
