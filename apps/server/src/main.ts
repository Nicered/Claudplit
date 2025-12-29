import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ["http://localhost:13000", "http://localhost:3000"],
    credentials: true,
  });

  app.setGlobalPrefix("api");

  const port = process.env.PORT || 14000;
  await app.listen(port);
  console.log(`Server is running on http://localhost:${port}`);
}

bootstrap();
