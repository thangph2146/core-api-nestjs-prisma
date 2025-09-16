import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  });
  
  await app.listen(process.env.PORT ?? 6789);
  console.log(`🚀 Core API đang chạy trên port ${process.env.PORT ?? 6789}`);
}
bootstrap();
