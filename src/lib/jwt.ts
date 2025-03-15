import jwt from 'jsonwebtoken';

// Set JWT secret key from environment or use a default for development
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-for-development';

// Define the payload structure
export interface JwtPayload {
  email: string;
  user_id: string;
  team_id?: string;
  is_admin?: boolean;
  is_judge?: boolean;
}

/**
 * Generate a JWT token
 */
export function generateToken(payload: JwtPayload): string {
  // Set token to expire in 1 day (24 hours)
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
} 