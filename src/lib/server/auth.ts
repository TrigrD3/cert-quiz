import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import prisma from './database';
import { dev } from '$app/environment';

// This should be in an environment variable in production
const JWT_SECRET = dev ? 'dev_secret_key' : process.env.JWT_SECRET || 'production_secret_key';

export interface UserData {
  id: string;
  email: string;
  username: string;
}

export interface UserSession {
  user: UserData;
  token: string;
}

export async function registerUser(email: string, username: string, password: string): Promise<UserSession> {
  // Check if user already exists
  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    throw new Error('Email already in use');
  }

  const existingUsername = await prisma.user.findUnique({ where: { username } });
  if (existingUsername) {
    throw new Error('Username already in use');
  }

  // Hash password with argon2
  const passwordHash = await argon2.hash(password);

  // Create new user
  const user = await prisma.user.create({
    data: {
      email,
      username,
      passwordHash
    }
  });

  // Generate JWT token
  const userData: UserData = {
    id: user.id,
    email: user.email,
    username: user.username
  };

  const token = jwt.sign(userData, JWT_SECRET, { expiresIn: '7d' });

  return { user: userData, token };
}

export async function loginUser(emailOrUsername: string, password: string): Promise<UserSession> {
  // Find user by email or username
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: emailOrUsername },
        { username: emailOrUsername }
      ]
    }
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Verify password with argon2
  const passwordValid = await argon2.verify(user.passwordHash, password);
  if (!passwordValid) {
    throw new Error('Invalid credentials');
  }

  // Generate JWT token
  const userData: UserData = {
    id: user.id,
    email: user.email,
    username: user.username
  };

  const token = jwt.sign(userData, JWT_SECRET, { expiresIn: '7d' });

  return { user: userData, token };
}

export function validateToken(token: string): UserData {
  try {
    return jwt.verify(token, JWT_SECRET) as UserData;
  } catch (err) {
    throw new Error('Invalid token');
  }
}