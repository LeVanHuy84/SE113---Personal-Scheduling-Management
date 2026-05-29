import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.test.local' });
if (!process.env.DATABASE_TEST_URL) {
  throw new Error('Missing DATABASE_TEST_URL for e2e tests');
}

process.env.DATABASE_URL = process.env.DATABASE_TEST_URL;
