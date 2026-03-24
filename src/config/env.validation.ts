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

  const jwtAccessExpiresInSeconds = config.JWT_ACCESS_EXPIRES_IN_SECONDS;
  if (typeof jwtAccessExpiresInSeconds === 'string') {
    validated.JWT_ACCESS_EXPIRES_IN_SECONDS = jwtAccessExpiresInSeconds;
  }

  const jwtVerifyExpiresInSeconds = config.JWT_VERIFY_EXPIRES_IN_SECONDS;
  if (typeof jwtVerifyExpiresInSeconds === 'string') {
    validated.JWT_VERIFY_EXPIRES_IN_SECONDS = jwtVerifyExpiresInSeconds;
  }

  return validated;
}
