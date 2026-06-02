type EnvironmentVariables = Record<string, string>;

function requireEnv(config: Record<string, unknown>, key: string): string {
  const value = config[key];

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

export function validateEnvironment(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validated: EnvironmentVariables = {
    NODE_ENV: requireEnv(config, 'NODE_ENV'),
    PORT: requireEnv(config, 'PORT'),
    DATABASE_URL: requireEnv(config, 'DATABASE_URL'),
    DATABASE_TEST_URL: requireEnv(config, 'DATABASE_TEST_URL'),
    REDIS_HOST: requireEnv(config, 'REDIS_HOST'),
    REDIS_PORT: requireEnv(config, 'REDIS_PORT'),
    BULLMQ_PREFIX: requireEnv(config, 'BULLMQ_PREFIX'),
  };

  const redisPassword = config.REDIS_PASSWORD;
  if (typeof redisPassword === 'string') {
    validated.REDIS_PASSWORD = redisPassword;
  }

  const jwtAccessSecret = config.JWT_ACCESS_SECRET;
  if (typeof jwtAccessSecret === 'string') {
    validated.JWT_ACCESS_SECRET = jwtAccessSecret;
  }

  const jwtVerifySecret = config.JWT_VERIFY_SECRET;
  if (typeof jwtVerifySecret === 'string') {
    validated.JWT_VERIFY_SECRET = jwtVerifySecret;
  }

  const jwtResetSecret = config.JWT_RESET_SECRET;
  if (typeof jwtResetSecret === 'string') {
    validated.JWT_RESET_SECRET = jwtResetSecret;
  }

  const jwtRefreshSecret = config.JWT_REFRESH_SECRET;
  if (typeof jwtRefreshSecret === 'string') {
    validated.JWT_REFRESH_SECRET = jwtRefreshSecret;
  }

  const jwtAccessExpiresInSeconds = config.JWT_ACCESS_EXPIRES_IN_SECONDS;
  if (typeof jwtAccessExpiresInSeconds === 'string') {
    validated.JWT_ACCESS_EXPIRES_IN_SECONDS = jwtAccessExpiresInSeconds;
  }

  const jwtVerifyExpiresInSeconds = config.JWT_VERIFY_EXPIRES_IN_SECONDS;
  if (typeof jwtVerifyExpiresInSeconds === 'string') {
    validated.JWT_VERIFY_EXPIRES_IN_SECONDS = jwtVerifyExpiresInSeconds;
  }

  const jwtResetExpiresInSeconds = config.JWT_RESET_EXPIRES_IN_SECONDS;
  if (typeof jwtResetExpiresInSeconds === 'string') {
    validated.JWT_RESET_EXPIRES_IN_SECONDS = jwtResetExpiresInSeconds;
  }

  const jwtRefreshExpiresInSeconds = config.JWT_REFRESH_EXPIRES_IN_SECONDS;
  if (typeof jwtRefreshExpiresInSeconds === 'string') {
    validated.JWT_REFRESH_EXPIRES_IN_SECONDS = jwtRefreshExpiresInSeconds;
  }

  const emailHost = config.EMAIL_HOST;
  if (typeof emailHost === 'string') {
    validated.EMAIL_HOST = emailHost;
  }

  const emailPort = config.EMAIL_PORT;
  if (typeof emailPort === 'string') {
    validated.EMAIL_PORT = emailPort;
  }

  const emailUser = config.EMAIL_USER;
  if (typeof emailUser === 'string') {
    validated.EMAIL_USER = emailUser;
  }

  const emailPass = config.EMAIL_PASS;
  if (typeof emailPass === 'string') {
    validated.EMAIL_PASS = emailPass;
  }

  const emailFrom = config.EMAIL_FROM;
  if (typeof emailFrom === 'string') {
    validated.EMAIL_FROM = emailFrom;
  }

  const appBaseUrl = config.FRONTEND_BASE_URL;
  if (typeof appBaseUrl === 'string') {
    validated.FRONTEND_BASE_URL = appBaseUrl;
  }

  const corsAllowedOrigins = config.CORS_ALLOWED_ORIGINS;
  if (typeof corsAllowedOrigins === 'string') {
    validated.CORS_ALLOWED_ORIGINS = corsAllowedOrigins;
  }

  const firebaseEnabledRaw = config.FIREBASE_ENABLED;
  const firebaseEnabled =
    typeof firebaseEnabledRaw === 'string' &&
    firebaseEnabledRaw.toLowerCase() === 'true';
  if (typeof firebaseEnabledRaw === 'string') {
    validated.FIREBASE_ENABLED = firebaseEnabledRaw;
  }

  if (firebaseEnabled) {
    validated.FIREBASE_PROJECT_ID = requireEnv(config, 'FIREBASE_PROJECT_ID');
    validated.FIREBASE_CLIENT_EMAIL = requireEnv(config, 'FIREBASE_CLIENT_EMAIL');
    validated.FIREBASE_PRIVATE_KEY = requireEnv(config, 'FIREBASE_PRIVATE_KEY');
  } else {
    const firebaseProjectId = config.FIREBASE_PROJECT_ID;
    if (typeof firebaseProjectId === 'string') {
      validated.FIREBASE_PROJECT_ID = firebaseProjectId;
    }

    const firebaseClientEmail = config.FIREBASE_CLIENT_EMAIL;
    if (typeof firebaseClientEmail === 'string') {
      validated.FIREBASE_CLIENT_EMAIL = firebaseClientEmail;
    }

    const firebasePrivateKey = config.FIREBASE_PRIVATE_KEY;
    if (typeof firebasePrivateKey === 'string') {
      validated.FIREBASE_PRIVATE_KEY = firebasePrivateKey;
    }
  }

  return validated;
}
