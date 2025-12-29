import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./prisma/prisma.module";
import { ProjectModule } from "./project/project.module";
import { ChatModule } from "./chat/chat.module";
import { PreviewModule } from "./preview/preview.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    ProjectModule,
    ChatModule,
    PreviewModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
