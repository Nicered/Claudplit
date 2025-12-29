import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Dynamic CORS origin from environment variable
  const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:13000";
  const origins = corsOrigin.split(",").map((o) => o.trim());

  app.enableCors({
    origin: origins,
    credentials: true,
  });

  app.setGlobalPrefix("api");

  const port = process.env.PORT || 14000;
  await app.listen(port);
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`CORS enabled for: ${origins.join(", ")}`);
}

bootstrap();
