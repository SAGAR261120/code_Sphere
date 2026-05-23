import 'dotenv/config';
import app from './src/app.js';
import { connectDB } from './src/config/database.js';
import { connectRedis } from './src/config/redis.js';
import { startJobs } from './src/jobs/index.js';

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  await connectDB();
  await connectRedis();
  startJobs();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} [${process.env.NODE_ENV}]`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
