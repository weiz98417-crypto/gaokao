import dotenv from 'dotenv';
import { createApp } from './app';

// 加载环境变量
const envPath = process.env.ENV_FILE || '.env';
dotenv.config({ path: envPath });

const app = createApp();
const PORT = Number(process.env.PORT) || 3000;

const server = app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 gaokao-backend is running at http://localhost:${PORT}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  // eslint-disable-next-line no-console
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  // eslint-disable-next-line no-console
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});
