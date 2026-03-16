import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { readSecret } from '../utils/secrets';

dotenv.config();

// Read database credentials from Docker secrets or environment variables
const dbUser = readSecret('DB_USER_FILE', 'POSTGRES_USER', 'taskuser');
const dbPassword = readSecret('DB_PASSWORD_FILE', 'POSTGRES_PASSWORD', 'taskpass');
const dbHost = process.env.DB_HOST || 'postgres';
const dbPort = process.env.DB_PORT || '5432';
const dbName = process.env.DB_NAME || 'taskcollab';

// Support both DATABASE_URL and individual credentials
const databaseUrl = process.env.DATABASE_URL || `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;

export const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

// Test connection
export const testConnection = async (): Promise<boolean> => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    return false;
  }
};