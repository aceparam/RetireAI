import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }),
  );

  const frontend = config.get<string>("FRONTEND_URL") ?? "http://localhost:3000";
  app.enableCors({
    origin: [frontend],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  const port = config.get<number>("PORT") ?? 4000;
  await app.listen(port);
  new Logger("Bootstrap").log(`RetireAI API listening on http://localhost:${port}`);
}

bootstrap();
