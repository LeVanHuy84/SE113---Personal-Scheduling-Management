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

  return validated;
}
