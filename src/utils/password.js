import bcrypt from 'bcryptjs';

const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);

export const hashPassword = async (plain) => {
  return bcrypt.hash(plain, saltRounds);
};

export const comparePassword = async (plain, hash) => {
  return bcrypt.compare(plain, hash);
};
