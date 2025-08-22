import bcrypt from "bcrypt";

const rounds = Number(process.env.BCRYPT_ROUNDS ?? 10);

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, rounds);
}

export async function verifyPassword(plain: string, hashed: string) {
  return bcrypt.compare(plain, hashed);
}
