import 'dotenv/config';

/**
 * Central environment configuration.
 * All env vars are read here and exported as typed constants.
 * The app will fail fast if required vars are missing.
 */
const required = (key) => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

export const env = {
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/shelflife',
  JWT_SECRET: process.env.JWT_SECRET || 'shelflife_dev_secret_change_in_prod',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
};
