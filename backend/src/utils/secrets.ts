import fs from 'fs';
import path from 'path';

/**
 * Read a secret from a file or fall back to environment variable
 * @param fileEnvVar Environment variable containing path to secret file
 * @param directEnvVar Environment variable containing the secret directly
 * @param defaultValue Default value if neither is available
 */
export function readSecret(fileEnvVar: string, directEnvVar: string, defaultValue: string = ''): string {
  const secretFilePath = process.env[fileEnvVar];
  
  // Try to read from file first (Docker secrets)
  if (secretFilePath && fs.existsSync(secretFilePath)) {
    try {
      return fs.readFileSync(secretFilePath, 'utf8').trim();
    } catch (error) {
      console.error(`Error reading secret from ${secretFilePath}:`, error);
    }
  }
  
  // Fall back to direct environment variable
  return process.env[directEnvVar] || defaultValue;
}

/**
 * Get JWT secret from Docker secret or environment variable
 */
export function getJwtSecret(): string {
  return readSecret('JWT_SECRET_FILE', 'JWT_SECRET', 'your-super-secret-jwt-key-change-in-production-min-32-chars');
}
