import jwt from 'jsonwebtoken';

const accessSecret = process.env.JWT_ACCESS_SECRET || 'access-secret';
const refreshSecret = process.env.JWT_REFRESH_SECRET || 'refresh-secret';
const accessExpires = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const refreshExpires = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export const signAccessToken = (payload) => {
  return jwt.sign(payload, accessSecret, { expiresIn: accessExpires });
};

export const signRefreshToken = (payload) => {
  return jwt.sign(payload, refreshSecret, { expiresIn: refreshExpires });
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, accessSecret);
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, refreshSecret);
};
